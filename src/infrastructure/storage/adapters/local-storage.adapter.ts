import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

import { StorageAdapter } from '../interfaces/storage-adapter.interface';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly root = path.resolve('./storage');

  async upload(key: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(this.root, key);

    await fs.mkdir(path.dirname(filePath), {
      recursive: true,
    });

    await fs.writeFile(filePath, buffer);

    return key;
  }

  async download(key: string): Promise<Buffer> {
    return fs.readFile(path.join(this.root, key));
  }

  async delete(key: string): Promise<void> {
    await fs.rm(path.join(this.root, key), {
      force: true,
    });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.root, key));

      return true;
    } catch {
      return false;
    }
  }
}
