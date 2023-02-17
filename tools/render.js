const fs = require('fs/promises');
const { render } = require('ejs');

const renderType = async (type, node) => {
  const { content, ...data } = node;
  const template = await fs.readFile(`./templates/markdown/${type}.html`, 'utf-8');
  return render(template.trim(), {
    slot: content,
    data,
  });
};

module.exports = renderType;
