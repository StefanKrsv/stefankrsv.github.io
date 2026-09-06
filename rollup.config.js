import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import fs from 'fs';
import pkg from './package.json';

const SRC_DEFAULT = '_javascript';
const SRC_PWA = `${SRC_DEFAULT}/pwa`;
const DIST = 'assets/js/dist';

const banner = `/*!
 * ${pkg.name} v${pkg.version} | © ${pkg.since} ${pkg.author} | ${pkg.license} Licensed | ${pkg.homepage}
 */`;
const frontmatter = '---\npermalink: /:basename\n---\n';
const isProd = process.env.BUILD === 'production';

let hasWatched = false;

function cleanup() {
  fs.rmSync(DIST, { recursive: true, force: true });
  console.log(`> Directory "${DIST}" has been cleaned.`);
}

function insertFrontmatter() {
  return {
    name: 'insert-frontmatter',
    generateBundle(_, bundle) {
      for (const chunkOrAsset of Object.values(bundle)) {
        if (chunkOrAsset.type === 'chunk') {
          chunkOrAsset.code = frontmatter + chunkOrAsset.code;
        }
      }
    }
  };
}

function inlineDiscord() {
  return {
    name: 'inline-discord',
    writeBundle(_, bundle) {
      const chunk = Object.values(bundle).find((entry) => entry.type === 'chunk');
      const code = chunk.code.replace(/<\/script/gi, '<\\/script');
      fs.writeFileSync(
        '_includes/discord-script.html',
        `<script data-discord-widget>\n{% raw %}\n${code}\n{% endraw %}\n</script>\n`
      );
    }
  };
}

function build(
  filename,
  { src = SRC_DEFAULT, jekyll = false, outputName = null } = {}
) {
  const input = `${src}/${filename}.js`;
  const shouldWatch = hasWatched ? false : true;

  if (!hasWatched) {
    hasWatched = true;
  }

  return {
    input,
    output: {
      file: `${DIST}/${filename}.min.js`,
      format: 'iife',
      ...(outputName !== null && { name: outputName }),
      banner,
      sourcemap: !isProd && !jekyll && filename !== 'discord'
    },
    ...(shouldWatch && { watch: { include: `${SRC_DEFAULT}/**/*.js` } }),
    plugins: [
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/env'],
        plugins: [
          '@babel/plugin-transform-class-properties',
          '@babel/plugin-transform-private-methods'
        ]
      }),
      nodeResolve(),
      (isProd || filename === 'discord') && terser(),
      filename === 'discord' && inlineDiscord(),
      jekyll && insertFrontmatter()
    ]
  };
}

cleanup();

export default [
  build('commons'),
  build('discord'),
  build('home'),
  build('categories'),
  build('page'),
  build('post'),
  build('misc'),
  build('theme', { outputName: 'Theme' }),
  build('app', { src: SRC_PWA, jekyll: true }),
  build('sw', { src: SRC_PWA, jekyll: true })
];
