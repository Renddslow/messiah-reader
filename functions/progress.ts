import { Handler, HandlerResponse } from '@netlify/functions';
import { to } from 'await-to-js';
import fauna from 'faunadb';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const CLIENT_SECRET = process.env.COOKIE_TOKEN || '';

type User = {
  firstName: string;
  lastName: string;
  email: string;
};

type JSONRef = {
  '@ref': {
    id: string;
  };
};

type FaunaData<T> = {
  ref: {
    toJSON: () => JSONRef;
  };
  data: T;
};

type Data = {
  data: {
    page: number;
    read_at: string;
    user: string;
  };
};

const q = fauna.query;
const client = new fauna.Client({
  secret: process.env.FAUNA_KEY || '',
  domain: 'db.fauna.com',
  scheme: 'https',
});

const safelyVerify = (token) => {
  try {
    return jwt.verify(token, CLIENT_SECRET);
  } catch (e) {
    return null;
  }
};

const handler: Handler = async (event) => {
  const { cookie: cookies } = event.headers;

  const response: HandlerResponse = {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/json',
    },
    statusCode: 200,
  };

  if (!cookies) {
    response.statusCode = 401;
    return Promise.resolve(response);
  }

  const token = cookie.parse(cookies)['messiah-token'];
  const tokenPayload = safelyVerify(token);

  if (!tokenPayload) {
    response.statusCode = 401;
    return Promise.resolve(response);
  }

  const { id } = tokenPayload;
  const [, user]: [null, FaunaData<User>] = await to(
    client.query(q.Get(q.Ref(q.Collection('users'), id))),
  );
  const userRef = user.ref.toJSON()['@ref'].id;

  const completions = (
    (await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index('completion-user'), userRef), {
          size: 150,
        }),
        q.Lambda('x', q.Get(q.Var('x'))),
      ),
    )) as { data: Data[] }
  ).data.map((c) => c.data);

  response.body = JSON.stringify({
    user: {
      firstName: user.data.firstName,
      lastName: user.data.lastName,
      email: user.data.email,
      id: userRef,
    },
    completions,
  });

  return Promise.resolve(response);
};

export { handler };
