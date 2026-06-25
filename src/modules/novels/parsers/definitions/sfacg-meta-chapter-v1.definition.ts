import { Lang } from '@/common/constants/lang.constant';
import { ParserDefinition } from '../engine/parser-definition';
import { RegexUtils } from '../engine/regex-utils';
import { scoreWith } from '../engine/scoring.util';
import { Logger } from '@nestjs/common';

const FORMAT_ID = 'sfacg-meta-chapter-v1';
const logger = new Logger(FORMAT_ID);

const TITLE_RE = /^书籍名称：(.+)$/m;
const AUTHOR_RE = /^作者名称：(.+)$/m;
const STATUS_RE = /^是否完结：(.+)$/m;
const CHAPTER_HEADING_RE = /^第\s*(\d+)\s*章\s*(.+)$/m;
const NOVEL_NUMBER_RE = /^小说序号：(.+)$/m;
const NOVEL_WORD_COUNT_RE = /^小说字数：(.+)$/m;
const AUTHOR_TAGS_RE = /^作者标签：(.+)$/m;

const mapStatus = (status: string | null) => {
    if (!status) return null;
    if (status.includes('未完')) return 'ongoing';
    if (status.includes('完结')) return 'completed';
    return null;
};

export const sfacgMetaChapterV1Definition: ParserDefinition = {
    formatId: FORMAT_ID,
    languageCode: Lang.CHINESE_PRC,
    matchScore: (text: string) => {
        const hasTitle = RegexUtils.safeTest(TITLE_RE, text);
        const hasAuthor = RegexUtils.safeTest(AUTHOR_RE, text);
        const hasStatus = RegexUtils.safeTest(STATUS_RE, text);
        const hasChapterHeading = RegexUtils.safeTest(CHAPTER_HEADING_RE, text);

        const hasNovelNumber = RegexUtils.safeTest(NOVEL_NUMBER_RE, text);
        const hasWordCount = RegexUtils.safeTest(NOVEL_WORD_COUNT_RE, text);
        const hasAuthorTags = RegexUtils.safeTest(AUTHOR_TAGS_RE, text);

        const score = scoreWith((scorer) => {
            scorer
                .addIf(hasTitle, 15)
                .addIf(hasAuthor, 15)
                .addIf(hasStatus, 15)
                .addIf(hasChapterHeading, 25)
                .addIf(hasNovelNumber, 15)
                .addIf(hasWordCount, 15)
                .addIf(hasAuthorTags, 15)
                // If it contains the exact watermark keywords of the pack aggregator,
                // explicitly hand it an unbeatable scoring weight bonus.
                .addIfAll(
                    [hasNovelNumber, hasWordCount, hasAuthorTags, hasTitle],
                    50
                );
        });

        logger.log(`${FORMAT_ID} score: ${score}`);

        return score;
    },
    metadata: {
        title: {
            type: 'regex',
            regex: TITLE_RE,
        },
        author: {
            type: 'regex',
            regex: AUTHOR_RE,
        },
        status: {
            type: 'regex',
            regex: STATUS_RE,
            transform: (value) => mapStatus(value),
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
    },
};
