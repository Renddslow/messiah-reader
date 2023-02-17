const splitBlocks = (content) => {
  const lines = content.split('\n');
  const blocks = [];
  const isHeader = (line) => /^#{1,6}\s/.test(line);

  let block = [];
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isHeader(line)) {
      blocks.push(line);
      inBlock = false;
      continue;
    }

    if (!line.trim() && inBlock) {
      blocks.push(block.join('\n'));
      block = [];
      continue;
    }

    if (!line.trim() && !inBlock) {
      inBlock = true;
      continue;
    }

    if (line.trim() && !inBlock) {
      inBlock = true;
      block.push(line);
      continue;
    }

    if (inBlock) {
      block.push(line);
    }
  }

  if (block.length) {
    blocks.push(block.join('\n'));
  }

  return blocks;
};

module.exports = splitBlocks;
