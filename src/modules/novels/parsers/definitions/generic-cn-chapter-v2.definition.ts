import { Lang } from '@/common/constants/lang.constant';
import { ParserDefinition } from '../engine/parser-definition';
import { parseChineseChapterNumber } from '../engine/chapter-number.util';
import { RegexUtils } from '../engine/regex-utils';
import { Logger } from '@nestjs/common';

const FORMAT_ID = 'generic-cn-chapter-v2';
const logger = new Logger(FORMAT_ID);

/**
 * Breakdown of Group Allocations:
 * Group 1: Standard Chapter Number (e.g. "一" from "第一章"). Undefined for prologues.
 * Group 2: The Title.
 *          - If standard: captures the entire "第一章、..." title
 *          - If prologue: captures the entire "序章、仙约" match string
 */
const CHAPTER_HEADING_RE =
  /(?:^|[\s\u3000]+)(?:(?=第\s*([0-9零一二两三四五六七八九十百千万]+)\s*章)|(?=(?:序|前|楔)\s*章))((?:第\s*[0-9零一二两三四五六七八九十百千万]+\s*章.*)|(?:序|前|楔)\s*章.*)$/m;

export const genericCnChapterV2Definition: ParserDefinition = {
  formatId: FORMAT_ID,
  languageCode: Lang.CHINESE_PRC,
  matchScore: (text: string) => {
    let score = 0;
    const hasChapter = RegexUtils.safeTest(CHAPTER_HEADING_RE, text);
    if (hasChapter) score += 5;

    logger.log(`${FORMAT_ID} score: ${score}`);
    return score;
  },
  metadata: {},
  chapter: {
    heading: {
      regex: CHAPTER_HEADING_RE,
      numberGroup: 1,
      titleGroup: 2,
    },
    numberParser: (match: string) => {
      if (!match) {
        return 1;
      }
      return parseChineseChapterNumber(match) + 1;
    },
    volume: {
      startAt: 1,
      incrementOnReset: true,
    },
  },
};
