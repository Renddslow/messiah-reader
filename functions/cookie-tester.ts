import cookie from 'cookie';
import { to } from 'await-to-js';
import jwt from 'jsonwebtoken';
import { Handler } from '@netlify/functions';

// TODO: if user has no cookie, redirect to /login
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const safelyVerify = (token) => {
  try {
    return jwt.verify(token, CLIENT_SECRET);
  } catch (e) {
    return null;
  }
};

const handler: Handler = async (event) => {
  const { cookie: cookies } = event.headers;

  if (!cookies) {
    return Promise.resolve({
      statusCode: 302,
      headers: {
        Location: '/login',
      },
    });
  }

  const token = cookie.parse(cookies)['messiah-token'];
  const tokenPayload = safelyVerify(token);

  if (!tokenPayload) {
    return Promise.resolve({
      statusCode: 302,
      headers: {
        Location: '/login',
      },
    });
  }

  return {
    statusCode: 302,
    headers: {
      Location: '/read',
    },
  };
};

export { handler };
