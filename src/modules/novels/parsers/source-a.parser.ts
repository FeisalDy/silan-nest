import {
  NovelParser,
  ParsedChapter,
  ParsedNovel,
} from '../interfaces/parsed-novel.interface';

/**
 * SourceA format:
 *
 * Title: <title>
 * Author: <author>
 * Synopsis: <synopsis (single line)>
 *
 * Chapter 1 – <title>
 * <content lines>
 *
 * Chapter 1.2 – <title>   ← sub-chapter variant
 * <content lines>
 */
export class SourceAParser implements NovelParser {
  private static readonly TITLE_RE = /^Title:\s*(.+)$/m;
  private static readonly AUTHOR_RE = /^Author:\s*(.+)$/m;
  private static readonly SYNOPSIS_RE = /^Synopsis:\s*(.+)$/m;

  /**
   * Matches:
   *   Chapter 3 – Some Title
   *   Chapter 3.2 – Some Title
   * Groups: (chapterNumber)(chapterSubNumber?)(title)
   */
  private static readonly CHAPTER_HEADING_RE =
    /^Chapter\s+(\d+)(?:\.(\d+))?\s*[-–—]\s*(.*)$/m;

  parse(text: string): ParsedNovel {
    const title = SourceAParser.TITLE_RE.exec(text)?.[1]?.trim() ?? '';
    const author = SourceAParser.AUTHOR_RE.exec(text)?.[1]?.trim() ?? '';
    const synopsis = SourceAParser.SYNOPSIS_RE.exec(text)?.[1]?.trim() ?? '';
    const chapters = this.extractChapters(text);

    return { title, author, synopsis, chapters };
  }

  private extractChapters(text: string): ParsedChapter[] {
    const chapters: ParsedChapter[] = [];
    const headingRe = new RegExp(SourceAParser.CHAPTER_HEADING_RE.source, 'gm');

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
      content,
    };
  }
}
