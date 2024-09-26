const esbuild = require('esbuild');
const { argv } = require('process');

const isWatch = argv.includes('--watch');
const isProduction = argv.includes('--production');

const ctx = {
  entryPoints: ['./src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node14',
  sourcemap: !isProduction,
  minify: isProduction,
};

if (isWatch) {
  esbuild.context(ctx).then(context => {
    context.watch();
    console.log('Watching...');
  }).catch(() => process.exit(1));
} else {
  esbuild.build(ctx).catch(() => process.exit(1));
}