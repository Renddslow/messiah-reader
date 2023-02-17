const globby = require('globby');
const fs = require('fs/promises');
const matter = require('gray-matter');

const parseMarkdown = require('./parseMarkdown');

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

(async () => {
  await Promise.all((await getFiles()).map(parseFrontmatter).map(parseMarkdown));
})();
