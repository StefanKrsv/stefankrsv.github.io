import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const template = fs.readFileSync(new URL('../_includes/comments/giscus.html', import.meta.url), 'utf8');
const script = template.match(/<script>([\s\S]*)<\/script>/)[1]
  .replace(/\{%[-\s]*comment[\s\S]*?endcomment[-\s]*%\}/g, '')
  .replace(/\{\{[\s\S]*?\}\}/g, 'test');

function setup(observers = true) {
  let callback;
  let themeChange;
  let disconnected = false;
  const children = [];
  const document = {
    createElement: () => ({ setAttribute() {}, appendChild: child => children.push(child) }),
    querySelector: () => ({ insertAdjacentElement() {} }),
    getElementsByClassName: () => []
  };
  class Observer {
    constructor(fn) { callback = fn; }
    observe() {}
    disconnect() { disconnected = true; }
  }
  const window = observers ? { IntersectionObserver: Observer } : {};
  vm.runInNewContext(script, {
    document, window, IntersectionObserver: Observer,
    Theme: { getThemeMapper: () => ({ dark: 'dark' }), visualState: 'dark', ID: 'theme' },
    addEventListener: (_, fn) => { themeChange = fn; }
  });
  return { children, trigger: entries => callback(entries), disconnected: () => disconnected,
    changeTheme: () => themeChange({ source: window, data: { id: 'theme' } }) };
}

test('comments load once near the viewport, not on article startup', () => {
  const view = setup();
  assert.equal(view.children.length, 0);
  assert.doesNotThrow(view.changeTheme);
  view.trigger([{ isIntersecting: false }]);
  assert.equal(view.children.length, 0);
  view.trigger([{ isIntersecting: true }]);
  view.trigger([{ isIntersecting: true }]);
  assert.equal(view.children.length, 1);
  assert.equal(view.disconnected(), true);
});

test('older browsers still load comments', () => {
  assert.equal(setup(false).children.length, 1);
});
