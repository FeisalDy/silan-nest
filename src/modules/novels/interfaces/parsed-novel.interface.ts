export interface ParsedChapter {
  chapterNumber: number;
  chapterSubNumber: number;
  title: string;
  content: string;
}

export interface ParsedNovel {
  title: string;
  author: string;
  synopsis: string;
  chapters: ParsedChapter[];
}

export interface NovelParser {
  parse(text: string): ParsedNovel;
}
