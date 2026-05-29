import * as fs from 'fs';
import * as path from 'path';

export function loadFixture(name: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../fixtures', name), 'utf8');
}

export function normalize(raw: string) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\u3000/g, ' ')
    .trim();
}
