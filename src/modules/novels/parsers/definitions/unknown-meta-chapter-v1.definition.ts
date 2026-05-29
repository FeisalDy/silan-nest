import { Lang } from '@/common/constants/lang.constant';
import {
  ParsedNovelMetadata,
  ParserDefinition,
} from '../engine/parser-definition';
import { normalizeSynopsis } from '@/modules/novels/parsers/engine/synopsis-normalize.util';
import { RegexUtils } from '../engine/regex-utils';
import { Logger } from '@nestjs/common';

const FORMAT_ID = 'unknown-meta-chapter-v1';
const logger = new Logger(FORMAT_ID);

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

const pickPrefaceTitle = (metadata: ParsedNovelMetadata) => metadata.title;

export const unknownMetaChapterV1Definition: ParserDefinition = {
  formatId: FORMAT_ID,
  languageCode: Lang.CHINESE_PRC,
  matchScore: (text: string) => {
    let score = 0;

    const hasAuthor = RegexUtils.safeTest(AUTHOR_RE, text);
    const hasSynopsis = RegexUtils.safeTest(SYNOPSIS_START_RE, text);
    const hasChapterHeading = RegexUtils.safeTest(CHAPTER_HEADING_RE, text);

    if (hasAuthor) {
      score += 10;
    }

    if (hasSynopsis) {
      score += 10;
    }

    if (hasChapterHeading) {
      score += 35;
    }

    if (hasAuthor && hasSynopsis && hasChapterHeading) {
      score += 25;
    }

    const title = extractTitle(text);
    if (title) {
      score += 5;
    }

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
      transform: (value: string) => {
        const lines = value.split(/\r?\n/);

        const filteredLines = lines
          .map((line) => {
            if (/[\s\u3000]*简介[：:]/.test(line)) {
              return line.replace(/[\s\u3000]*简介[：:]\s*/, '').trim();
            }
            return line;
          })
          .filter((line) => {
            const trimmed = line.trim();
            if (!trimmed) return false;
            if (/^[（(]提醒：本书超慢热/.test(trimmed)) return false;
            return true;
          });

        // Pass our cleanly filtered array strings back to your reusable utility
        return normalizeSynopsis(filteredLines.join('\n'));
      },
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
