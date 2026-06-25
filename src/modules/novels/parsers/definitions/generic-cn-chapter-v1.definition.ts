import { Lang } from '@/common/constants/lang.constant';
import { ParserDefinition } from '../engine/parser-definition';
import { parseChineseChapterNumber } from '../engine/chapter-number.util';
import { RegexUtils } from '../engine/regex-utils';
import { scoreWith } from '../engine/scoring.util';
import { Logger } from '@nestjs/common';

const FORMAT_ID = 'generic-cn-chapter-v1';
const logger = new Logger(FORMAT_ID);

const CHAPTER_HEADING_RE =
    /^\s*第\s*([0-9零一二两三四五六七八九十百千万]+)\s*章[：\s]*(.*)$/m;

export const genericCnChapterV1Definition: ParserDefinition = {
    formatId: FORMAT_ID,
    languageCode: Lang.CHINESE_PRC,
    matchScore: (text: string) => {
        const hasChapter = RegexUtils.safeTest(CHAPTER_HEADING_RE, text);
        const score = scoreWith((scorer) => {
            scorer.addIf(hasChapter, 5);
        });

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
        numberParser: parseChineseChapterNumber,
        volume: {
            startAt: 1,
            incrementOnReset: true,
        },
    },
};
