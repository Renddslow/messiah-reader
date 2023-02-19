import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const EMAIL_SECRET = process.env.EMAIL_TOKEN;
const COOKIE_SECRET = process.env.COOKIE_TOKEN;

const safelyVerify = (token) => {
  try {
    return jwt.verify(token, EMAIL_SECRET);
  } catch (e) {
    return null;
  }
};

const handler = async (event) => {
  const { token } = event.queryStringParameters;

  const verified = await safelyVerify(token);

  if (!verified) {
    return Promise.resolve({
      statusCode: 302,
      headers: {
        Location: '/login',
      },
    });
  }

  const { id } = verified;

  const cookieToken = await jwt.sign({ id }, COOKIE_SECRET);

  return Promise.resolve({
    headers: {
      'set-cookie': cookie.serialize('messiah-token', cookieToken, {
        maxAge: 60 * 60 * 24 * 30 * 6, // ~6 months
        httpOnly: true,
      }),
      Location: '/read',
    },
    statusCode: 302,
  });
};

exports.handler = handler;
