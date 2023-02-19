const tokenizeMarkdownBlock = (value) => {
  const tokens = [];

  let string = '';
  let inLink = false;
  let inItalic = false;
  let inBold = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (/>/.test(char)) {
      const endOfLineIndex = value.slice(i).indexOf('\n');
      tokens.push(
        endOfLineIndex > -1 ? value.slice(i, endOfLineIndex + i).trim() : value.slice(i).trim(),
      );
      i += endOfLineIndex > -1 ? endOfLineIndex : value.slice(i).length;
      continue;
    }

    if (/\?/.test(char) && /\[/.test(value[i + 1])) {
      const token = value.slice(i).trim();
      tokens.push(token);
      i += token.length;
      continue;
    }

    if (/\[/.test(char) && /\[/.test(value[i + 1])) {
      i += 1;
      string = '[[';
      inLink = true;
      continue;
    }

    if (/\*/.test(char) && /\*/.test(value[i + 1])) {
      inBold = !inBold;
    }

    if (/_/.test(char)) {
      inItalic = !inItalic;
    }

    if (/]/.test(char) && /]/.test(value[i + 1])) {
      i += 1;
      string += ']]';
      inLink = false;
      tokens.push(string.replace(/[\n\r]+/, ''));
      string = '';
      continue;
    }

    if (/\s/.test(char) && !(inLink || inItalic || inBold)) {
      tokens.push(string);
      string = '';
      continue;
    }

    string += char;
  }

  if (string && tokens.slice(-1)[0] !== string) {
    tokens.push(string);
  }

  return tokens;
};

module.exports = tokenizeMarkdownBlock;
