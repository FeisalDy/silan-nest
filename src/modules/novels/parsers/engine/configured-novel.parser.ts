import { NovelParser, ParsedNovel } from '../../interfaces/parsed-novel.interface';
import { ParserDefinition } from './parser-definition';
import { ParserEngine } from './parser-engine';

export class ConfiguredNovelParser implements NovelParser {
  readonly formatId: string;
  readonly formatAliases?: string[];

  constructor(
    private readonly definition: ParserDefinition,
    private readonly engine: ParserEngine
  ) {
    this.formatId = definition.formatId;
    this.formatAliases = definition.formatAliases;
  }

  match(text: string): number {
    return this.definition.matchScore(text);
  }

  parse(text: string, chapterLimit?: number): ParsedNovel {
    return this.engine.parse(text, this.definition, chapterLimit);
  }
}
