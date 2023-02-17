import mri from 'mri';
import { build } from 'esbuild';

const prog = mri(process.argv.slice(2), {
  boolean: ['watch', 'minify'],
});

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'browser',
  outfile: 'public/main.js',
  minify: prog.minify,
  watch: prog.watch,
});
