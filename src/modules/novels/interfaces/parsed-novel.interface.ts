import { Lang } from '@/common/constants/lang.constant';

export interface ParsedChapter {
  chapterNumber: number;
  chapterSubNumber: number;
  volumeNumber: number;
  title: string;
  content: string;
}

export interface ParsedNovel {
  title: string | null;
  author: string | null;
  synopsis: string | null;
  status: string | null;
  languageCode: Lang;
  chapters: ParsedChapter[];
}

export interface NovelParser {
  /**
   * `formatId` identifies a parsing contract/schema, not the transport/origin.
   * Suggested convention: `<ecosystem>-<structure>-v<version>`
   * Examples: `sfacg-meta-chapter-v1`, `generic-cn-chapter-v1`, `markdown-headings-v1`.
   * Increment the version when parser assumptions/schema compatibility changes.
   */
  formatId: string;
  /**
   * Optional alternate identifiers for backwards-compatibility or aliasing
   * older format ids to newer parsers.
   */
  formatAliases?: string[];
  match(text: string): number;
  parse(text: string, chapterLimit?: number): ParsedNovel;
}
