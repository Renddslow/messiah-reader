const globby = require('globby');
const fs = require('fs/promises');
const matter = require('gray-matter');
const { render } = require('ejs');
const mkdirp = require('mkdirp');

const parseMarkdown = require('./parseMarkdown');
const path = require('path');

const getFiles = async () => {
  const files = await globby(['content/**/*.md', 'content/*.md']);
  return Promise.all(
    files.map(async (filepath) => ({
      filepath,
      raw: await fs.readFile(filepath, 'utf-8'),
    })),
  );
};

const parseFrontmatter = (file) => {
  const { data, content } = matter(file.raw);
  return {
    ...file,
    data,
    markdownRaw: content,
  };
};

const saveFile = async (file) => {
  file = await file;
  const newPath = file.filepath.replace('content', 'public/read').replace('.md', '.html');
  await mkdirp(path.dirname(newPath));
  return fs.writeFile(newPath, file.content);
};

const wrapFile = async (file) => {
  const template = await fs.readFile('templates/baseof.html', 'utf-8');
  const inlineCSS = await fs.readFile('fold.min.css', 'utf-8');
  file.content = render(template, { slot: file.content, inlineCSS, isBlue: false });
  return file;
};

const pipr =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => v.then(f), Promise.resolve(x));

(async () => {
  const files = await getFiles();
  const build = pipr(parseFrontmatter, parseMarkdown, wrapFile, saveFile);
  await Promise.all(files.map(build));
})();
