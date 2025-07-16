const { build } = require('esbuild');
const { execSync } = require('child_process');

const baseConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  minify: true,
  target: 'es2020',
  platform: 'browser',
  outdir: 'dist',
  external: ['ethers', '@lit-protocol/constants', 'json-stable-stringify'],
};

async function buildAll() {
  // Clean dist directory
  execSync('rm -rf dist', { stdio: 'inherit' });

  // Generate TypeScript declarations
  execSync('tsc --emitDeclarationOnly --outDir dist', { stdio: 'inherit' });

  // Build CommonJS
  await build({
    ...baseConfig,
    format: 'cjs',
    outExtension: { '.js': '.js' },
  });

  // Build ESM
  await build({
    ...baseConfig,
    format: 'esm',
    outExtension: { '.js': '.mjs' },
  });

  console.log('Build completed successfully!');
}

if (require.main === module) {
  buildAll().catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}

module.exports = { buildAll };