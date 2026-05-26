import { Injectable } from '@nestjs/common';
import {
  NovelParser,
  ParsedNovel,
  ParsedChapter,
} from '../interfaces/parsed-novel.interface';
import { Lang } from '@/common/constants/lang.constant';

@Injectable()
export class GenericCnChapterV1Parser implements NovelParser {
  readonly formatId = 'generic-cn-chapter-v1';

  private static readonly CHAPTER_HEADING_RE =
    /^\s*第\s*([0-9零一二两三四五六七八九十百千万]+)\s*章[：\s]*(.*)$/m;

  match(text: string): number {
    if (GenericCnChapterV1Parser.CHAPTER_HEADING_RE.test(text)) {
      return 20;
    }

    return 0;
  }

  parse(text: string, chapterLimit?: number): ParsedNovel {
    const chapters = this.extractChapters(text, chapterLimit);

    return {
      title: null,
      author: null,
      status: null,
      synopsis: null,
      chapters,
      languageCode: Lang.CHINESE_PRC,
    };
  }

  private extractChapters(
    text: string,
    chapterLimit?: number
  ): ParsedChapter[] {
    const chapters: ParsedChapter[] = [];
    const headingRe = new RegExp(
      GenericCnChapterV1Parser.CHAPTER_HEADING_RE.source,
      'gm'
    );

    let match: RegExpExecArray | null;
    let lastIndex = 0;
    let lastMatch: RegExpExecArray | null = null;
    let currentVolume = 1;
    let previousChapterNumber = 0;

    while ((match = headingRe.exec(text)) !== null) {
      if (lastMatch) {
        const content = text.slice(lastIndex, match.index).trim();
        chapters.push(this.buildChapter(lastMatch, content, currentVolume));

        if (chapterLimit && chapters.length >= chapterLimit) {
          return chapters;
        }
      }

      const chapterNumber = this.parseChapterNumber(match[1]);

      if (lastMatch !== null) {
        if (chapterNumber <= previousChapterNumber) {
          currentVolume++;
        }
      }

      previousChapterNumber = chapterNumber;
      lastMatch = match;
      lastIndex = headingRe.lastIndex;
    }

    if (lastMatch && (!chapterLimit || chapters.length < chapterLimit)) {
      const content = text.slice(lastIndex).trim();
      chapters.push(this.buildChapter(lastMatch, content, currentVolume));
    }

    return chapters;
  }

  private buildChapter(
    match: RegExpExecArray,
    content: string,
    volumeNumber: number
  ): ParsedChapter {
    return {
      chapterNumber: this.parseChapterNumber(match[1]),
      chapterSubNumber: 0,
      volumeNumber,
      title: match[2]?.trim() ?? '',
      content,
    };
  }

  private parseChapterNumber(str: string): number {
    if (/^\d+$/.test(str)) {
      return parseInt(str, 10);
    }

    const map: Record<string, number> = {
      零: 0,
      一: 1,
      二: 2,
      两: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
      十: 10,
      百: 100,
      千: 1000,
      万: 10000,
    };

    const result = 0;
    let section = 0;
    let number = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const val = map[char];
      if (val === undefined) continue;

      if (val === 10000) {
        if (number === 0 && section === 0) number = 1;
        section = (section + number) * 10000;
        number = 0;
      } else if (val >= 10) {
        if (number === 0) number = 1;
        section += number * val;
        number = 0;
      } else {
        number = val;
      }
    }

    return result + section + number;
  }
}
