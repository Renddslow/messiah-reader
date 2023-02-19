import fauna from 'faunadb';
import { to } from 'await-to-js';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { Handler, HandlerResponse } from '@netlify/functions';

const CLIENT_SECRET = process.env.COOKIE_TOKEN || '';

const q = fauna.query;
const client = new fauna.Client({
  secret: process.env.FAUNA_KEY || '',
  domain: 'db.fauna.com',
  scheme: 'https',
});

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

const safelyVerify = (token) => {
  try {
    return jwt.verify(token, CLIENT_SECRET);
  } catch (e) {
    return null;
  }
};

const handler: Handler = async (event) => {
  const { cookie: cookies } = event.headers;
  const { id: pageId, lastPage } = event.queryStringParameters;

  const page = parseInt(pageId, 10);

  if (!page) {
    return Promise.resolve({
      statusCode: 302,
      headers: {
        Location: '/read',
      },
    });
  }

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

  const payload = {
    user: userRef,
    read_at: new Date().toISOString(),
    page,
  };

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

  if (completions.find((c) => c.page === page)) {
    response.statusCode = 302;
    response.headers = {
      Location: lastPage === 'true' ? '/read' : `/read/${page + 1}`,
    };
    return Promise.resolve(response);
  }

  await client.query(q.Create(q.Collection('completions'), { data: payload }));

  response.body = JSON.stringify(payload);
  response.headers = {
    Location: lastPage === 'true' ? '/read' : `/read/${page + 1}`,
  };
  response.statusCode = 302;
  return Promise.resolve(response);
};

export { handler };
