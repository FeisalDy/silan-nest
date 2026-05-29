import { Lang } from '@/common/constants/lang.constant';
import {
  ParsedNovelMetadata,
  ParserDefinition,
} from '../engine/parser-definition';

const AUTHOR_RE = /^[\s\u3000]*作者[：:]\s*(.+)$/m;
const SYNOPSIS_START_RE = /^[\s\u3000]*简介[：:]\s*(.*)$/m;
const SYNOPSIS_END_RE = /^[\s\u3000]*\S+\s*-\s*\S+/m;
const CHAPTER_HEADING_RE = /^[\s\u3000]*(\d+)\s*-\s*(.+)$/m;

const extractTitle = (text: string): string | null => {
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
};

const normalizeSynopsis = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s\u3000]+|[\s\u3000]+$/g, ''))
    .filter((line) => line.length > 0)
    .join('\n');

const pickPrefaceTitle = (metadata: ParsedNovelMetadata) => metadata.title;

export const unknownMetaChapterV1Definition: ParserDefinition = {
  formatId: 'unknown-meta-chapter-v1',
  languageCode: Lang.CHINESE_PRC,
  matchScore: (text: string) => {
    let score = 0;

    if (AUTHOR_RE.test(text)) {
      score += 20;
    }

    if (SYNOPSIS_START_RE.test(text)) {
      score += 20;
    }

    if (CHAPTER_HEADING_RE.test(text)) {
      score += 40;
    }

    const title = extractTitle(text);

    if (title && title.length <= 80) {
      score += 5;
    }

    return score;
  },
  metadata: {
    title: {
      type: 'extractor',
      extractor: extractTitle,
    },
    author: {
      type: 'regex',
      regex: AUTHOR_RE,
    },
    synopsis: {
      type: 'block',
      start: SYNOPSIS_START_RE,
      end: SYNOPSIS_END_RE,
      includeStartCapture: true,
      transform: normalizeSynopsis,
    },
  },
  chapter: {
    heading: {
      regex: CHAPTER_HEADING_RE,
      numberGroup: 1,
      titleGroup: 2,
    },
    numberParser: (raw) => parseInt(raw, 10),
    volume: {
      startAt: 1,
      incrementOnReset: true,
    },
    preface: {
      enabled: true,
      titleFrom: pickPrefaceTitle,
      chapterNumber: 1,
      volumeNumber: 0,
    },
  },
};
