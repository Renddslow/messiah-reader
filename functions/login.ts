import fauna from 'faunadb';
import { to } from 'await-to-js';
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import { Handler } from '@netlify/functions';
import qs from 'qs';

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

const EMAIL_TOKEN = process.env.EMAIL_TOKEN;
sgMail.setApiKey(process.env.SENDGRID_KEY);

const emailBody = (token, firstName, lastName, email) => `<!DOCTYPE html>
<html lang="en-US">
   <head>
      <style>
         p {
         margin-bottom: 12px;
         }
         .copy-link {
         margin-top: 24px;
         }
         .cta {
         padding: 12px 24px;
         box-sizing: border-box;
         font-size: 16px;
         appearance: none;
         -webkit-appearance: none;
         border: none;
         border-radius: 8px;
         background: #f2c218;
         font-weight: 600;
         display: block;
         max-width: max-content;
         text-decoration: none;
         line-height: 1.2;
         color: #16145b !important;
         border: 0;
         cursor: pointer;
         }
      </style>
   </head>
   <body>
      <p>Hey there, ${firstName}!</p>
      <p>
         Thank you so much for reading the Scriptures as we encounter the Messiah together this series. I'm so excited for what you'll discover as you move slowly and thoughtfully through the Bible.
      </p>
      <p>Below is your magic link. Just click it and you'll be logged in!</p>
      <a
         href="https://messiah.flatland.church/auth?token=${token}"
         class="cta"
         >✨ Your Magic Link ✨</a>
      <div class="copy-link">
         <p>
            If you have trouble with the button, copy and paste the link below into your browser bar:
         </p>
         <p>
            https://messiah.flatland.church/auth?token=${token}
         </p>
      </div>
      <footer style="text-align: center; margin-top: 24px">
         <div style="font-size: 12px; color: #434443">
            <p style="margin-bottom: 0">
               This system email was sent to ${firstName} ${lastName} (${email}) regarding your
               messiah.flatland.church account
            </p>
            <p>by Flatland Group, 501(c)3 47-0795919, 4801 N 144th Street, Omaha, NE 68116</p>
         </div>
         <p style="color: #434443">
            If you have any questions, simply respond to this email and we'll be happy to help.
         </p>
      </footer>
   </body>
</html>
`;

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return Promise.resolve({ statusCode: 405 });

  const { firstName, lastName, email } = qs.parse(event.body);
  console.log(firstName, lastName, email);

  const [err, user]: [Error, FaunaData<User>] = await to(
    client.query(q.Get(q.Match(q.Index('emails'), email))),
  );

  if (err && !(firstName || lastName)) {
    return Promise.resolve({
      statusCode: 400,
    });
  }

  const tokenPayload = {
    id: user && user.ref.toJSON()['@ref'].id,
  };

  if (err && firstName && lastName) {
    const payload = {
      firstName,
      lastName,
      email,
      created: new Date().toISOString(),
    };

    const [, user]: [null, FaunaData<User>] = await to(
      client.query(q.Create(q.Collection('users'), { data: payload })),
    );
    tokenPayload.id = user && user.ref.toJSON()['@ref'].id;

    console.log(`Created new user with email address: ${email}`);
  }

  const token = await jwt.sign(tokenPayload, EMAIL_TOKEN);

  await sgMail
    .send({
      html: emailBody(
        token,
        user?.data?.firstName || firstName,
        user?.data?.lastName || lastName,
        email,
      ),
      to: email,
      from: {
        email: 'no-reply@flatland.church',
        name: 'Matt at Flatland',
      },
      replyTo: {
        email: 'mubatt@wyopub.com',
        name: 'Matt McElwee',
      },
      subject: `${user?.data?.firstName || firstName}, Your magic link for the Messiah Reader`,
    })
    .catch((e) => {
      console.log(e);
    });

  return Promise.resolve({ statusCode: 302, headers: { Location: '/wait' } });
};

export { handler };
