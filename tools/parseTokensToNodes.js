const tokenizeMarkdownBlock = require('./tokenizeMarkdownBlock');

const mergeTextNodes = (nodes) => {
  return nodes.reduce((acc, node) => {
    if (node.type === 'text') {
      if (acc.length && acc[acc.length - 1].type === 'text') {
        acc[acc.length - 1].content += ` ${node.content}`;
      } else {
        acc.push({
          type: 'text',
          content: node.content,
        });
      }
      return acc;
    }

    return [...acc, node];
  }, []);
};

const parseTokensToNodes =
  (book, recursed = false) =>
  (block) => {
    if (block?.type) return block;
    const nodes = [];
    const poetryBlock = /^>/.test(block[0]);

    for (let i = 0; i < block.length; i++) {
      const token = block[i];

      if (/^>+\s/.test(token)) {
        nodes.push({
          type: 'poetry_line',
          content: token.replace(/^>+\s/, ''),
        });
        continue;
      }

      if (/^\[\[/.test(token)) {
        const [, link] = token.exec(/^\[\[(.*?)]]$/);
        const [data, label, id] = link.split('|').map((t) => t.trim());
        nodes.push({
          type: 'link',
          id,
          link: data,
          content: label,
        });
        continue;
      }

      if (/^\*\*/.test(token)) {
        nodes.push({
          type: 'bold',
          content: token.replace(/^\*\*/, '').replace(/\*\*$/, ''),
        });
        continue;
      }

      if (/^_/.test(token)) {
        nodes.push({
          type: 'italic',
          content: token.replace(/^_/, '').replace(/_$/, ''),
        });
        continue;
      }

      if (/^{/.test(token)) {
        nodes.push({
          type: 'verse',
          book,
          content: token.replace(/^\{/, '').replace(/\}$/, ''),
        });
        continue;
      }

      nodes.push({
        type: 'text',
        content: token,
      });
    }

    const tree = {
      type: poetryBlock ? 'poetry' : 'paragraph',
      children: mergeTextNodes(nodes),
    };

    if (tree.type === 'poetry') {
      tree.children = tree.children.map((node) => {
        const { content, ...n } = node;
        return {
          ...n,
          children: parseTokensToNodes(book, true)(tokenizeMarkdownBlock(content)),
        };
      });
    }

    return recursed ? tree.children : tree;
  };

module.exports = parseTokensToNodes;
