import {
  NovelParser,
  ParsedChapter,
  ParsedNovel,
} from '../interfaces/parsed-novel.interface';
import { Lang } from '../../../common/constants/lang.constant';

/**
 * SourceB format:
 *
 * 《<title>》
 * 作者：<author>
 *
 * 【简介】
 * <synopsis lines until next section>
 *
 * 第001章 <title>
 * <content lines>
 *
 * 第001章第02节 <title>   ← sub-chapter variant
 * <content lines>
 */
export class SourceBParser implements NovelParser {
  private static readonly TITLE_RE = /《(.+?)》/;
  private static readonly AUTHOR_RE = /作者[：:]\s*(.+)/;
  private static readonly SYNOPSIS_START_RE = /【简介】/;

  /**
   * Matches:
   *   第001章 Title
   *   第001章第02节 Title
   * Groups: (chapterNumber)(chapterSubNumber?)(title)
   */
  private static readonly CHAPTER_HEADING_RE =
    /^第(\d+)章(?:第(\d+)节)?\s*(.*)$/m;

  parse(text: string): ParsedNovel {
    const title = SourceBParser.TITLE_RE.exec(text)?.[1]?.trim() ?? '';
    const author = SourceBParser.AUTHOR_RE.exec(text)?.[1]?.trim() ?? '';
    const synopsis = this.extractSynopsis(text);
    const chapters = this.extractChapters(text);
    const status = '';

    return {
      title,
      author,
      synopsis,
      chapters,
      status,
      languageCode: Lang.CHINESE_PRC,
    };
  }

  private extractSynopsis(text: string): string {
    const startMatch = SourceBParser.SYNOPSIS_START_RE.exec(text);
    if (!startMatch) return '';

    const afterSynopsisStart = text.slice(
      startMatch.index + startMatch[0].length,
    );
    const headingRe = new RegExp(SourceBParser.CHAPTER_HEADING_RE.source, 'm');
    const nextSection = headingRe.exec(afterSynopsisStart);
    const raw = nextSection
      ? afterSynopsisStart.slice(0, nextSection.index)
      : afterSynopsisStart;

    return raw.trim();
  }

  private extractChapters(text: string): ParsedChapter[] {
    const chapters: ParsedChapter[] = [];
    const headingRe = new RegExp(SourceBParser.CHAPTER_HEADING_RE.source, 'gm');

    let match: RegExpExecArray | null;
    let lastIndex = 0;
    let lastMatch: RegExpExecArray | null = null;

    while ((match = headingRe.exec(text)) !== null) {
      if (lastMatch) {
        const content = text.slice(lastIndex, match.index).trim();
        chapters.push(this.buildChapter(lastMatch, content));
      }
      lastMatch = match;
      lastIndex = headingRe.lastIndex;
    }

    if (lastMatch) {
      const content = text.slice(lastIndex).trim();
      chapters.push(this.buildChapter(lastMatch, content));
    }

    return chapters;
  }

  private buildChapter(match: RegExpExecArray, content: string): ParsedChapter {
    return {
      chapterNumber: parseInt(match[1], 10),
      chapterSubNumber: match[2] ? parseInt(match[2], 10) : 0,
      title: match[3]?.trim() ?? '',
      volumeNumber: 1,
      content,
    };
  }
}
