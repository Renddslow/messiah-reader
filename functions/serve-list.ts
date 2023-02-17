import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import * as fs from 'fs';
import * as path from 'path';

const handler: Handler = async () => {
  const list = fs.readFileSync(path.join(__dirname, '..', 'templates/list-template.html'), 'utf8');
  return {
    statusCode: 200,
    body: list,
  };
};

export { handler };
