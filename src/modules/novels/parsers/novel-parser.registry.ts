import { BadRequestException, Injectable } from '@nestjs/common';
import { SourceAParser } from '@/modules/novels/parsers/source-a.parser';
import { SourceBParser } from '@/modules/novels/parsers/source-b.parser';
import { SourceCParser } from '@/modules/novels/parsers/source-c.parser';
import { NovelParser } from '@/modules/novels/interfaces/parsed-novel.interface';

@Injectable()
export class NovelParserRegistry {
  constructor(
    private readonly sourceAParser: SourceAParser,
    private readonly sourceBParser: SourceBParser,
    private readonly sourceCParser: SourceCParser
  ) {}

  get(source: string): NovelParser {
    switch (source) {
      case 'source-a':
        return this.sourceAParser;

      case 'source-b':
        return this.sourceBParser;

      case 'source-c':
        return this.sourceCParser;

      default:
        throw new BadRequestException(`Unsupported import source: "${source}"`);
    }
  }

  supportedSources() {
    return ['source-a', 'source-b', 'source-c'];
  }
}
