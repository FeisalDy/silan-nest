import { ParserDefinition } from '@/modules/novels/parsers/engine/parser-definition';
import { Lang } from '@/common/constants/lang.constant';
import { parseChineseChapterNumber } from '@/modules/novels/parsers/engine/chapter-number.util';
import { normalizeSynopsis } from '@/modules/novels/parsers/engine/synopsis-normalize.util';
import { RegexUtils } from '@/modules/novels/parsers/engine/regex-utils';
import { scoreWith } from '@/modules/novels/parsers/engine/scoring.util';
import { Logger } from '@nestjs/common';

const FORMAT_ID = 'xsqishu-meta-chapter-v1';
const logger = new Logger(FORMAT_ID);

const AUTHOR_RE = /^作者[：:][ \t]*(.+)$/m;

const CATEGORY_RE = /^分类[：:][ \t]*(.+)$/m;

const SYNOPSIS_START_RE = /^[ \t\u3000]*内容简介[ \t\u3000]*$/m;

const CHAPTER_HEADING_RE =
    /^[ \t\u3000]*第[ \t\u3000]*([0-9零一二两三四五六七八九十百千万]+)[ \t\u3000]*章(?:[：: \t]+(.+))?$/m;

const extractTitle = (text: string): string | null => {
    const lines = text.split(/\r?\n/);

    const authorIndex = lines.findIndex((line) => AUTHOR_RE.test(line.trim()));

    if (authorIndex <= 0) {
        return null;
    }

    for (let i = authorIndex - 1; i >= 0; i--) {
        const line = lines[i].trim();

        if (!line) continue;

        // separators
        if (/^=+$/.test(line)) continue;

        // ads / links
        if (line.includes('http://')) continue;
        if (line.includes('https://')) continue;
        if (line.includes('更多精校小说')) continue;

        // accidental metadata
        if (line.startsWith('作者')) continue;
        if (line.startsWith('分类')) continue;
        if (line.startsWith('内容简介')) continue;

        // chapter heading safeguard
        if (CHAPTER_HEADING_RE.test(line)) continue;

        return line;
    }

    return null;
};

export const xsqishuMetaChapterV1Definition: ParserDefinition = {
    formatId: FORMAT_ID,
    languageCode: Lang.CHINESE_PRC,
    matchScore: (text: string) => {
        const hasAuthor = RegexUtils.safeTest(AUTHOR_RE, text);
        const hasCategory = RegexUtils.safeTest(CATEGORY_RE, text);
        const hasSynopsis = RegexUtils.safeTest(SYNOPSIS_START_RE, text);
        const hasChapterHeading = RegexUtils.safeTest(CHAPTER_HEADING_RE, text);

        const title = extractTitle(text);

        const score = scoreWith((scorer) => {
            scorer
                .addIf(hasAuthor, 15)
                .addIf(hasCategory, 25)
                .addIf(hasSynopsis, 25)
                .addIf(hasChapterHeading, 20)
                .addIfAll(
                    [hasAuthor, hasCategory, hasSynopsis, hasChapterHeading],
                    25
                )
                .addIf(Boolean(title && !title.includes('：')), 1);
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
            end: CHAPTER_HEADING_RE,
            transform: normalizeSynopsis,
        },
    },
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
