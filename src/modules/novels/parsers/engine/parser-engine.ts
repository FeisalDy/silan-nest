import { Injectable } from '@nestjs/common';
import { ParsedNovel } from '../../interfaces/parsed-novel.interface';
import { ParserDefinition } from './parser-definition';
import { MetadataExtractor } from './metadata-extractor';
import { ChapterExtractor } from './chapter-extractor';

@Injectable()
export class ParserEngine {
  constructor(
    private readonly metadataExtractor: MetadataExtractor,
    private readonly chapterExtractor: ChapterExtractor
  ) {}

  parse(
    text: string,
    definition: ParserDefinition,
    chapterLimit?: number
  ): ParsedNovel {
    const metadata = this.metadataExtractor.extract(
      text,
      definition,
      definition.chapter.heading.regex
    );
    const chapters = this.chapterExtractor.extract(
      text,
      definition,
      metadata,
      chapterLimit
    );

    return {
      title: metadata.title,
      author: metadata.author,
      status: metadata.status,
      synopsis: metadata.synopsis,
      chapters,
      languageCode: definition.languageCode,
    };
  }
}
