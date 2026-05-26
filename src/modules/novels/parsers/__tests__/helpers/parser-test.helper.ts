import * as fs from 'fs';
import * as path from 'path';

export function loadFixture(name: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../fixtures', name), 'utf8');
}
