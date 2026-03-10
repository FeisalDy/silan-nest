import {
  NovelParser,
  ParsedChapter,
  ParsedNovel,
} from '../interfaces/parsed-novel.interface';
import { Lang } from '../../../common/constants/lang.constant';

/**
 * SourceC — multi-pattern auto-detect parser.
 *
 * Ported from the Python script. Supports a wide set of chapter heading
 * styles (Chinese, English, Indonesian, alphanumeric codes, weak numeric)
 * and merges undersized chapters until they reach MIN_CHAPTER_CHARS.
 *
 * Header metadata (title / author / synopsis) is not yet detected by this
 * source — placeholders are returned so the rest of the pipeline keeps
 * working while you implement extraction later.
 */

const MIN_CHAPTER_CHARS = 2000;

/** Strong chapter-heading patterns, tried in order. */
const STRONG_PATTERNS: RegExp[] = [
  // 1.  第X章 / 第X回 (with optional leading number + dot)
  /^\s*(\d+\.)?\s*第.{0,30}?章/,
  /^\s*第.{0,50}?[章回]/,
  // 2. English
  /^Chapter\s+\d+/i,
  /^CHAPTER\s+\d+/,
  // 3. Indonesian
  /^Bab\s+\d+/i,
  // 4. Alphanumeric codes  e.g. AB0042
  /^\s*[A-Z]{2}\d{4}/i,
];

/** Weak fallback: lines that are just a number followed by a dot, e.g. "42." */
const WEAK_PATTERN = /^\d+\.\s*$/;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface DetectResult {
  starts: number[];
  mode: 'strong' | 'weak' | null;
}

function detectChapterStarts(lines: string[]): DetectResult {
  // --- strong pass ---
  const strongStarts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i].trim();
    if (
      stripped.length <= 80 &&
      STRONG_PATTERNS.some((p) => p.test(stripped))
    ) {
      strongStarts.push(i);
    }
  }
  if (strongStarts.length >= 3) {
    return { starts: strongStarts, mode: 'strong' };
  }

  // --- weak fallback ---
  const weakStarts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (WEAK_PATTERN.test(lines[i].trim())) {
      weakStarts.push(i);
    }
  }
  if (weakStarts.length >= 3) {
    return { starts: weakStarts, mode: 'weak' };
  }

  return { starts: [], mode: null };
}

function splitAndMergeChapters(text: string): string[][] | null {
  const lines = text.split('\n');
  const { starts } = detectChapterStarts(lines);

  if (starts.length === 0) return null;

  // Slice raw chapter blocks
  const raw: string[][] = starts.map((start, idx) => {
    const end = idx + 1 < starts.length ? starts[idx + 1] : lines.length;
    return lines.slice(start, end);
  });

  // Merge blocks that are too short into the next one
  const merged: string[][] = [];
  let buffer: string[] = [];

  for (const block of raw) {
    buffer.push(...block);
    const charCount = buffer.reduce((sum, l) => sum + l.trim().length, 0);
    if (charCount >= MIN_CHAPTER_CHARS) {
      merged.push(buffer);
      buffer = [];
    }
  }

  if (buffer.length > 0) {
    merged.push(buffer);
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export class SourceCParser implements NovelParser {
  parse(text: string): ParsedNovel {
    // TODO: implement title extraction for this source format
    const title = '';

    // TODO: implement author extraction for this source format
    const author = '';

    // TODO: implement synopsis extraction for this source format
    const synopsis = '';

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

  private extractChapters(text: string): ParsedChapter[] {
    const blocks = splitAndMergeChapters(text);

    if (!blocks) return [];

    return blocks.map((lines, idx) => {
      const firstLine = lines[0]?.trim() ?? '';
      const content = lines.slice(1).join('\n').trim();

      return {
        chapterNumber: idx + 1,
        chapterSubNumber: 0,
        title: firstLine,
        volumeNumber: 1,
        content,
      };
    });
  }
}
