import {readFile} from 'node:fs/promises';

import * as esbuild from 'esbuild';

import {PLUGIN_ID} from '../src/shared/plugin-id.ts';

const minifiedCssAsText: esbuild.Plugin = {
  name: 'minified-css-as-text',
  setup(build) {
    build.onLoad({filter: /\.css$/}, async ({path}) => {
      const source = await readFile(path, 'utf8');
      const {code} = await esbuild.transform(source, {
        loader: 'css',
        minify: true,
      });
      return {contents: code.trim(), loader: 'text'};
    });
  },
};

// The host supplies React and its own packages through the loader's require.
const clientBuild: esbuild.BuildOptions = {
  entryPoints: ['src/client/index.tsx'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  plugins: [minifiedCssAsText],
  external: ['react', 'react/jsx-runtime', '@deepseek-ai/*'],
  banner: {
    js: [
      `window.__ModuleLoader__.load({id: '${PLUGIN_ID}', factory: require => {`,
      'var module = {exports: {}};',
      'var exports = module.exports;',
    ].join('\n'),
  },
  footer: {js: 'return module.exports;\n}});'},
};

const serverBuild: esbuild.BuildOptions = {
  entryPoints: ['src/server/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  packages: 'external',
};

const builds = [clientBuild, serverBuild].map(options => ({
  ...options,
  legalComments: 'none' as const,
  logLevel: 'info' as const,
}));

if (process.argv.includes('--watch')) {
  for (const options of builds) {
    await (await esbuild.context(options)).watch();
  }
} else {
  await Promise.all(builds.map(options => esbuild.build(options)));
}
