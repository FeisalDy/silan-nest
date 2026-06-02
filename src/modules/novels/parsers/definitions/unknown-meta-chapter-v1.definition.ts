import { Lang } from '@/common/constants/lang.constant';
import {
  ParsedNovelMetadata,
  ParserDefinition,
} from '../engine/parser-definition';
import { normalizeSynopsis } from '@/modules/novels/parsers/engine/synopsis-normalize.util';
import { RegexUtils } from '../engine/regex-utils';
import { scoreWith } from '../engine/scoring.util';
import { Logger } from '@nestjs/common';

const FORMAT_ID = 'unknown-meta-chapter-v1';
const logger = new Logger(FORMAT_ID);

const AUTHOR_RE = /^[\s\u3000]*作者[：:]\s*(.+)$/m;
const SYNOPSIS_START_RE = /^[\s\u3000]*简介[：:]\s*(.*)$/m;
const SYNOPSIS_END_RE = /^[\s\u3000]*\S+\s*-\s*\S+/m;
const CHAPTER_HEADING_RE = /^[\s\u3000]*(\d+)\s*-\s*(.+)$/m;

const stripReminderLine = (raw: string): string => {
  const lines = raw.split(/\r?\n/);
  const trimmedFirst = lines[0]?.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');

  if (trimmedFirst && /^（提醒[:：]/.test(trimmedFirst)) {
    return lines.slice(1).join('\n');
  }

  return raw;
};

const extractTitle = (text: string): string | null => {
  const lines = text.split(/\r?\n/);

  let authorIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^[\s\u3000]*作者[：:]/.test(lines[i])) {
      authorIndex = i;
      break;
    }
  }

  if (authorIndex <= 0) {
    return null;
  }

  for (let i = authorIndex - 1; i >= 0; i--) {
    const trimmed = lines[i].replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');

    if (!trimmed) {
      continue;
    }

    if (/^(作者|简介)[：:]/.test(trimmed)) {
      continue;
    }

    return trimmed;
  }

  return null;
};

const pickPrefaceTitle = (metaData: ParsedNovelMetadata) => metaData.title;

export const unknownMetaChapterV1Definition: ParserDefinition = {
  formatId: FORMAT_ID,
  languageCode: Lang.CHINESE_PRC,
  matchScore: (text: string) => {
    const hasAuthor = RegexUtils.safeTest(AUTHOR_RE, text);
    const hasSynopsis = RegexUtils.safeTest(SYNOPSIS_START_RE, text);
    const hasChapterHeading = RegexUtils.safeTest(CHAPTER_HEADING_RE, text);

    const title = extractTitle(text);

    const score = scoreWith((scorer) => {
      scorer
        .addIf(hasAuthor, 10)
        .addIf(hasSynopsis, 10)
        .addIf(hasChapterHeading, 35)
        .addIfAll([hasAuthor, hasSynopsis, hasChapterHeading], 25)
        .addIf(Boolean(title), 1);
    });

    logger.log(`${FORMAT_ID} score: ${score}`);

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
      transform: (raw) => normalizeSynopsis(stripReminderLine(raw)),
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
