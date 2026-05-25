import {
  NovelParser,
  ParsedChapter,
  ParsedNovel,
} from '../interfaces/parsed-novel.interface';
import { Lang } from '../../../common/constants/lang.constant';
import { Injectable } from '@nestjs/common';

/**
 * SourceA format example:
 *
 * 书籍详细
 * 书籍名称：变成精灵女王的我又成了人族皇后
 * 作者名称：御坂12586号
 * 小说序号：387183
 * 小说字数：1032368
 * 是否完结：未完
 * 最后更新：2022-04-13T13:44:04
 * 作者标签：异世界 恋爱 嫁人 变身
 *
 * 第1章 第一章 精灵女王不好当
 * <content>
 */
@Injectable()
export class SourceAParser implements NovelParser {
  private static readonly TITLE_RE = /^书籍名称：(.+)$/m;
  private static readonly AUTHOR_RE = /^作者名称：(.+)$/m;
  private static readonly STATUS_RE = /^是否完结：(.+)$/m;

  private static readonly CHAPTER_HEADING_RE = /^第\s*(\d+)\s*章\s*(.+)$/m;

  parse(text: string, chapterLimit?: number): ParsedNovel {
    const title = SourceAParser.TITLE_RE.exec(text)?.[1]?.trim() ?? null;
    const author = SourceAParser.AUTHOR_RE.exec(text)?.[1]?.trim() ?? null;
    const status = this.mapStatus(
      SourceAParser.STATUS_RE.exec(text)?.[1]?.trim() ?? null
    );

    const chapters = this.extractChapters(text, chapterLimit);

    return {
      title,
      author,
      status,
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
    const headingRe = new RegExp(SourceAParser.CHAPTER_HEADING_RE.source, 'gm');

    let match: RegExpExecArray | null;
    let lastIndex = 0;
    let lastMatch: RegExpExecArray | null = null;

    let currentVolume = 1;
    let previousChapterNumber = 0;

    while ((match = headingRe.exec(text)) !== null) {
      const chapterNumber = parseInt(match[1], 10);

      if (lastMatch) {
        const content = text.slice(lastIndex, match.index).trim();

        chapters.push(this.buildChapter(lastMatch, content, currentVolume));

        if (chapterLimit && chapters.length >= chapterLimit) {
          return chapters;
        }
      }

      // detect new volume
      if (chapterNumber <= previousChapterNumber) {
        currentVolume++;
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
      chapterNumber: parseInt(match[1], 10),
      chapterSubNumber: 0,
      volumeNumber,
      title: match[2]?.trim() ?? '',
      content,
    };
  }

  private mapStatus(status: string | null): string {
    if (!status) return 'unknown';

    if (status.includes('未完')) return 'ongoing';
    if (status.includes('完结')) return 'completed';

    return 'unknown';
  }
}
