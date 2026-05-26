import { BadRequestException, Injectable } from '@nestjs/common';
import { SfacgMetaChapterV1Parser } from '@/modules/novels/parsers/sfacg-meta-chapter-v1.parser';
import { NovelParser } from '../interfaces/parsed-novel.interface';
import { GenericCnChapterV1Parser } from '@/modules/novels/parsers/generic-cn-chapter-v1.parser';

@Injectable()
export class NovelParserRegistry {
  private readonly parsers: NovelParser[];

  constructor(
    private readonly genericCnChapterV1Parser: GenericCnChapterV1Parser,
    private readonly sfacgMetaChapterV1Parser: SfacgMetaChapterV1Parser
  ) {
    this.parsers = [genericCnChapterV1Parser, sfacgMetaChapterV1Parser];
  }

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
