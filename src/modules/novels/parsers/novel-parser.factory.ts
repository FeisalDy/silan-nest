import { BadRequestException } from '@nestjs/common';
import { NovelParser } from '../interfaces/parsed-novel.interface';
import { SourceAParser } from './source-a.parser';
import { SourceBParser } from './source-b.parser';
import { SourceCParser } from './source-c.parser';

export type NovelSource = 'source-a' | 'source-b' | 'source-c';

const PARSER_MAP: Record<NovelSource, new () => NovelParser> = {
  'source-a': SourceAParser,
  'source-b': SourceBParser,
  'source-c': SourceCParser,
};

export class NovelParserFactory {
  /**
   * Returns the appropriate parser for the given source key.
   * Throws BadRequestException for unsupported sources so NestJS
   * surfaces a clean 400 response to the caller.
   */
  static create(source: string): NovelParser {
    const ParserClass = PARSER_MAP[source as NovelSource];

    if (!ParserClass) {
      throw new BadRequestException(
        `Unsupported import source: "${source}". Supported sources: ${Object.keys(PARSER_MAP).join(', ')}.`,
      );
    }

    return new ParserClass();
  }

  static supportedSources(): NovelSource[] {
    return Object.keys(PARSER_MAP) as NovelSource[];
  }
}
