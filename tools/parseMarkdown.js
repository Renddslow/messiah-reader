const splitBlocks = require('./splitBlocks');
const tokenize = require('./tokenizeMarkdownBlock');
const parse = require('./parseTokensToNodes');
const render = require('./render');

const parseMarkdown = async (file) => {
  const blocks = splitBlocks(file.markdownRaw);
  const tree = blocks
    .map((b) => {
      if (/^#/.test(b)) {
        return {
          type: 'heading',
          level: b.match(/^#+/)[0].length,
          anchor: b.replace(/^#+/, '').trim().replace(/\s/g, '-'),
          content: b.replace(/^#+/, '').trim(),
        };
      }
      return tokenize(b);
    })
    .map(parse(file.data?.book));

  const rendered = (
    await Promise.all(
      tree.map(async (block) => {
        if (block.content) {
          return render(block.type, block);
        }
        const content = await Promise.all(
          block.children.map(async (child) => {
            if (child.children) {
              const children = await Promise.all(child.children.map((c) => render(c.type, c)));
              return render(child.type, { ...child, content: children.join(' ') });
            }
            return render(child.type, child);
          }),
        );

        return render(block.type, { content: content.join(' ') });
      }),
    )
  ).join('\n');

  return {
    ...file,
    content: rendered,
  };
};

module.exports = parseMarkdown;
