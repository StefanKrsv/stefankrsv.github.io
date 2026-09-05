import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync(new URL('../_javascript/discord.js', import.meta.url), 'utf8');
const cacheKey = 'discord-presence-v1';
const now = 1800000000000;
const presence = {
  discord_user: { id: '792751366698827799', username: 'stepan', avatar: 'avatar' },
  discord_status: 'online',
  activities: [{ name: 'A game', type: 0, timestamps: { start: now - 10000 } }]
};

function page(storage = new Map(), time = now, networkFails = false) {
  const elements = new Map();
  const attributes = new Map();
  const makeElement = () => ({
    textContent: '', innerHTML: '', src: '', href: '',
    classList: { contains: () => false }, style: { setProperty() {} }
  });
  let markup = '<div class="discord-placeholder">Loading</div>';
  const label = makeElement();
  const container = {
    get innerHTML() { return markup; },
    set innerHTML(value) {
      markup = value;
      for (const selector of ['.discord-avatar', '.discord-status-badge', '.discord-username',
        '.discord-status-text', '.discord-avatar-wrapper', '.discord-activity-container']) {
        elements.set(selector, makeElement());
      }
    },
    querySelector: selector => selector.includes('[role=') ? label : elements.get(selector),
    setAttribute: (key, value) => attributes.set(key, value)
  };
  const elapsed = makeElement();
  const sockets = [];
  let restoredAtConnect = false;
  class Socket {
    constructor() {
      restoredAtConnect = attributes.get('aria-busy') === 'false';
      if (networkFails) throw new Error('Offline');
      sockets.push(this);
    }
  }
  const context = {
    document: { documentElement: { lang: 'en' }, getElementById: id => id === 'discordStatusContainer' ? container : elapsed },
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    window: { addEventListener() {} }, WebSocket: Socket, URL,
    Date: { now: () => time }, setInterval() { return 1; }, clearInterval() {},
    setTimeout() {}, clearTimeout() {}, console: { log() {}, error() {} }
  };
  vm.runInNewContext(source, context);
  return { container, elements, attributes, elapsed, sockets, restoredAtConnect };
}

test('first visit keeps the skeleton until presence arrives, then caches data', () => {
  const storage = new Map();
  const view = page(storage);
  assert.match(view.container.innerHTML, /discord-placeholder/);
  view.sockets[0].onmessage({ data: JSON.stringify({ op: 0, t: 'INIT_STATE', d: presence }) });
  assert.equal(view.elements.get('.discord-username').textContent, 'stepan');
  assert.equal(view.attributes.get('aria-busy'), 'false');
  assert.deepEqual(JSON.parse(storage.get(cacheKey)).data, presence);
});

test('next document restores the profile before connecting and continues elapsed time', () => {
  const storage = new Map([[cacheKey, JSON.stringify({ data: presence, updatedAt: now })]]);
  const view = page(storage, now + 5000);
  assert.equal(view.restoredAtConnect, true);
  assert.equal(view.elements.get('.discord-username').textContent, 'stepan');
  assert.equal(view.elapsed.textContent, '0:15');
  assert.equal(JSON.parse(storage.get(cacheKey)).updatedAt, now, 'restoring must not extend stale data lifetime');
});

test('live updates replace restored data', () => {
  const storage = new Map([[cacheKey, JSON.stringify({ data: presence, updatedAt: now })]]);
  const view = page(storage, now + 5000);
  view.sockets[0].onmessage({ data: JSON.stringify({ op: 0, t: 'PRESENCE_UPDATE', d: { ...presence, discord_status: 'idle' } }) });
  assert.equal(view.elements.get('.discord-status-text').textContent, 'Away');
  assert.equal(JSON.parse(storage.get(cacheKey)).updatedAt, now + 5000);
});

test('unchanged reconnect data does not replace already loaded elements', () => {
  const storage = new Map([[cacheKey, JSON.stringify({ data: presence, updatedAt: now })]]);
  const view = page(storage, now + 5000);
  const avatar = view.elements.get('.discord-avatar');
  view.sockets[0].onmessage({ data: JSON.stringify({ op: 0, t: 'INIT_STATE', d: presence }) });
  assert.equal(view.elements.get('.discord-avatar'), avatar);
  assert.equal(JSON.parse(storage.get(cacheKey)).updatedAt, now + 5000);
});

test('offline reconnection preserves restored profile', () => {
  const storage = new Map([[cacheKey, JSON.stringify({ data: presence, updatedAt: now })]]);
  const view = page(storage, now, true);
  assert.equal(view.elements.get('.discord-username').textContent, 'stepan');
  assert.doesNotMatch(view.container.innerHTML, /discord-placeholder/);
});

test('expired, corrupt, and wrong-account entries fall back to the placeholder', () => {
  for (const value of ['broken JSON', JSON.stringify({ data: presence, updatedAt: now - 300001 }),
    JSON.stringify({ data: { ...presence, discord_user: { id: 'someone-else' } }, updatedAt: now })]) {
    assert.match(page(new Map([[cacheKey, value]])).container.innerHTML, /discord-placeholder/);
  }
});

test('disabled storage does not prevent live rendering', () => {
  const view = page({ get() { throw new Error('Blocked'); }, set() { throw new Error('Blocked'); } });
  view.sockets[0].onmessage({ data: JSON.stringify({ op: 0, t: 'INIT_STATE', d: presence }) });
  assert.equal(view.elements.get('.discord-username').textContent, 'stepan');
});
