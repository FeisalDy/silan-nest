/* eslint-disable */
import { BadRequestException } from '@nestjs/common';
import AdmZip from 'adm-zip';
import * as path from 'path';

export interface ZipValidationOptions {
  maxFiles?: number;
  maxUncompressedSize?: number;
  allowedExtensions?: string[];
}

export class ZipValidatorUtil {
  static async validate(
    file: Express.Multer.File,
    options: ZipValidationOptions = {}
  ): Promise<void> {
    const {
      maxFiles = 1000,
      maxUncompressedSize = 500 * 1024 * 1024, // 500 MB
      allowedExtensions = ['.txt'],
    } = options;

    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== '.zip') {
      throw new BadRequestException('Only .zip files are allowed');
    }

    const zip = new AdmZip(file.buffer);
    const entries = zip.getEntries();

    if (entries.length === 0) {
      throw new BadRequestException('ZIP archive is empty');
    }

    if (entries.length > maxFiles) {
      throw new BadRequestException(
        `ZIP archive contains too many files. Maximum allowed: ${maxFiles}`
      );
    }

    let totalUncompressedSize = 0;

    for (const entry of entries) {
      const filePath = entry.entryName;

      // Prevent Zip Slip
      if (
        filePath.includes('..') ||
        path.isAbsolute(filePath) ||
        filePath.startsWith('\\')
      ) {
        throw new BadRequestException(`Invalid path detected: ${filePath}`);
      }

      if (entry.isDirectory) {
        continue;
      }

      const entryExt = path.extname(filePath).toLowerCase();

      if (!allowedExtensions.includes(entryExt)) {
        throw new BadRequestException(`Unsupported file type: ${filePath}`);
      }

      totalUncompressedSize += entry.header.size;
    }

    if (totalUncompressedSize > maxUncompressedSize) {
      throw new BadRequestException(
        `Archive exceeds maximum uncompressed size of ${Math.floor(
          maxUncompressedSize / 1024 / 1024
        )} MB`
      );
    }
  }
}
