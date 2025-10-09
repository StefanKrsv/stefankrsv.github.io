import { createInterface } from 'readline';
import fs from 'fs';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

let startTime = Date.now();
const actions = [];
let text = '';

console.log('go');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key) => {
  if (key === '\r' || key === '\n') {
    const time = Date.now() - startTime;
    actions.push({ type: 'enter', time: time });
  } else if (key === '\u0003') {
    console.log('recorded:', actions);
    console.log('text:', text);

    const output = {
      actions: actions,
      finalText: text
    };
    fs.writeFileSync('actions.json', JSON.stringify(output, null, 2));
    console.log('saved to actions.json');
    process.stdin.setRawMode(false);
    rl.close();
    process.exit();
  } else if (key === '\x7F') {
    const time = Date.now() - startTime;
    actions.push({ type: 'delete', time: time });
    text = text.slice(0, -1);
  } else {
    const time = Date.now() - startTime;
    actions.push({ type: 'add', char: key, time: time });
    text += key;
  }
});
