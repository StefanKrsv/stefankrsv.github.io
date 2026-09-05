# stepan.be

Personal project notebook about robotics, electronics, and virtual reality, built with Jekyll and Chirpy. English and French posts, with optional live Discord presence.

## Local environment

Use Ruby 3.2, Bundler 2.5.23, and Node 22 or newer. On Windows, use Ubuntu/WSL for Ruby, with ruby-full, build-essential, and zlib1g-dev installed. Node commands can run from Windows in the same checkout.

```sh
gem install bundler -v 2.5.23
bundle config set --local path vendor/bundle
bundle install
npm ci
npm run build
bundle exec jekyll serve --host 127.0.0.1
```

Open http://localhost:4000; French pages are under /fr/. If Bundler was installed with --user-install, add its printed executable directory to PATH. Rebuild JavaScript after editing _javascript; Jekyll handles template and SCSS changes.

## Validation

```sh
npm test
npm run build
JEKYLL_ENV=production bundle exec jekyll build
bundle exec ruby tools/verify-site.rb
bundle exec htmlproofer _site --disable-external
```

The verification script checks both homepages, project routes, search indexes, image priority, and accessibility basics. Lockfiles make dependency installs reproducible. Pushes to master are built, linted, verified, and deployed by GitHub Pages.

## Content and customization

- English projects: _posts/; French translations: _posts/fr/, with matching filenames.
- Homepage: _layouts/home.html and _sass/pages/_home.scss.
- Discord widget: _javascript/discord.js and assets/css/sidebar-widget.css.
- Language selector: _includes/lang-selector.html. Explicit URLs determine language; switching preserves query parameters and fragments.
- Site identity and integrations: _config.yml.

Future-dated posts remain unpublished until their dates. The custom domain is configured in CNAME.

## License

MIT. See LICENSE for the original theme attribution.
