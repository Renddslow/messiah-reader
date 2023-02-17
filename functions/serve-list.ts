import { Handler } from '@netlify/functions';
import * as fs from 'fs';
import * as path from 'path';
import { render } from 'ejs';

type Week = {
  id: number;
  title: string;
  unlocks: string;
  unlocksFriendly: string;
  unlocked: boolean;
};

type Page = {
  id: number;
  title: string;
  week: number;
};

// Fauna lookups are slow. We'll do data fetch
// on the front-end and hydrate
const handler: Handler = async () => {
  const weeks = fs.readFileSync(path.join(__dirname, '..', 'weeks.json'), 'utf8');
  const pages = fs.readFileSync(path.join(__dirname, '..', 'pages.json'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'fold.min.css'), 'utf8');
  // Templates
  const base = fs.readFileSync(path.join(__dirname, '..', 'templates/baseof.html'), 'utf8');
  const list = fs.readFileSync(path.join(__dirname, '..', 'templates/week.html'), 'utf8');
  const page = fs.readFileSync(path.join(__dirname, '..', 'templates/page-list-item.html'), 'utf8');
  const home = fs.readFileSync(path.join(__dirname, '..', 'templates/home.html'), 'utf8');

  const weeksList = JSON.parse(weeks)
    .map(
      (week: Partial<Week>): Week => ({
        ...(week as Exclude<Week, 'unlocked'>),
        unlocked: new Date(week.unlocks) < new Date(),
      }),
    )
    .map((week: Week) =>
      render(list, {
        week,
        slot: JSON.parse(pages)
          .filter((p: Page) => p.week === week.id)
          .map((p: Page, idx) =>
            render(page, {
              page: {
                ...p,
                id: idx + 1,
                friendlyId: (idx + 1).toString().padStart(2, '0'),
              },
            }),
          )
          .join('\n'),
      }),
    )
    .join('\n');
  return {
    statusCode: 200,
    body: render(base, { slot: [home, weeksList].join('\n'), isBlue: true, inlineCSS: css }),
  };
};

export { handler };
