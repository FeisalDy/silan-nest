import { Lang } from '@/common/constants/lang.constant';
import { ParserDefinition } from '../engine/parser-definition';
import { parseChineseChapterNumber } from '../engine/chapter-number.util';
import { RegexUtils } from '../engine/regex-utils';

const CHAPTER_HEADING_RE =
  /^\s*第\s*([0-9零一二两三四五六七八九十百千万]+)\s*章[：\s]*(.*)$/m;

export const genericCnChapterV1Definition: ParserDefinition = {
  formatId: 'generic-cn-chapter-v1',
  languageCode: Lang.CHINESE_PRC,
  matchScore: (text: string) =>
    RegexUtils.safeTest(CHAPTER_HEADING_RE, text) ? 20 : 0,
  metadata: {},
  chapter: {
    heading: {
      regex: CHAPTER_HEADING_RE,
      numberGroup: 1,
      titleGroup: 2,
    },
    numberParser: parseChineseChapterNumber,
    volume: {
      startAt: 1,
      incrementOnReset: true,
    },
  },
};
