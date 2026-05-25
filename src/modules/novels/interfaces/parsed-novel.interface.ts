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
  status: string;
  languageCode: string;
  chapters: ParsedChapter[];
}

export interface NovelParser {
  parse(text: string, chapterLimit?: number): ParsedNovel;
}
