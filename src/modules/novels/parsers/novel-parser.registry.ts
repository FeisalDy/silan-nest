import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { NovelParser } from '../interfaces/parsed-novel.interface';
import { NOVEL_PARSERS } from './parser.tokens';

@Injectable()
export class NovelParserRegistry {
  constructor(@Inject(NOVEL_PARSERS) private readonly parsers: NovelParser[]) {}

  getByFormatId(formatId: string): NovelParser {
    if (!formatId) {
      throw new BadRequestException('Format id is required');
    }

    const parser = this.parsers.find(
      (item) =>
        item.formatId === formatId || item.formatAliases?.includes(formatId)
    );
    if (!parser) {
      throw new BadRequestException(
        `Unsupported format id: "${formatId}". Supported formats: ${this.supportedFormats().join(
          ', '
        )}.`
      );
    }

    return parser;
  }

  detect(text: string): NovelParser {
    const matches = this.parsers
      .map((parser) => ({
        parser,
        score: parser.match(text),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
      throw new BadRequestException(
        'Unable to detect novel format from the provided text.'
      );
    }

    const top = matches[0];

    console.log(
      matches.map((m) => `${m.parser.formatId}: ${m.score}`).join('\n')
    );

    if (matches.length > 1 && top.score === matches[1].score) {
      throw new BadRequestException(
        `Ambiguous novel format. Matches: ${matches
          .filter((m) => m.score === top.score)
          .map((m) => m.parser.formatId)
          .join(', ')}`
      );
    }

    return top.parser;
  }

  supportedFormats() {
    return this.parsers.map((parser) => parser.formatId);
  }
}
