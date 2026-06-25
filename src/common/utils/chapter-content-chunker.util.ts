export interface ChunkChapterContentOptions {
    maxLength?: number;
    breakBuffer?: number;
}

export interface ChunkedChapterPart {
    content: string;
    title: string | null;
    chapterSubNumber: number;
    partNumber: number;
}

const DEFAULT_MAX_LENGTH = 20000;
const DEFAULT_BREAK_BUFFER = 2000;

/**
 * Split long chapter content into multiple chunks using preferred
 * breakpoints (paragraphs/lines) within a buffer around the limit.
 */
export function ChunkChapterContent(
    content: string,
    options: ChunkChapterContentOptions = {}
): string[] {
    const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
    const breakBuffer = options.breakBuffer ?? DEFAULT_BREAK_BUFFER;

    if (maxLength <= 0 || content.length <= maxLength) {
        return [content];
    }

    const chunks: string[] = [];
    const minChunkLength = Math.max(1, maxLength - breakBuffer);
    const maxChunkLength = maxLength + breakBuffer;

    let start = 0;

    while (start < content.length) {
        const remaining = content.length - start;

        if (remaining <= maxLength) {
            chunks.push(content.slice(start));
            break;
        }

        const rangeStart = start + minChunkLength;
        const rangeEnd = Math.min(content.length, start + maxChunkLength);
        const splitIndex = findBestSplitIndex(content, rangeStart, rangeEnd);

        const end =
            splitIndex && splitIndex > start
                ? splitIndex
                : Math.min(start + maxLength, content.length);

        chunks.push(content.slice(start, end));
        start = end;
    }

    return chunks;
}

/**
 * Build chunked chapter parts with sequential sub numbers and
 * optional title suffixes for continuation parts.
 */
export function BuildChunkedChapterParts(params: {
    title: string | null;
    content: string;
    baseSubNumber?: number;
    options?: ChunkChapterContentOptions;
    titleSuffix?: (partNumber: number) => string;
}): ChunkedChapterPart[] {
    const baseSubNumber = params.baseSubNumber ?? 0;
    const normalizedTitle = params.title?.trim() || null;
    const suffixBuilder =
        params.titleSuffix ?? ((partNumber) => ` (Part ${partNumber})`);

    const chunks = ChunkChapterContent(params.content, params.options);

    return chunks.map((chunk, index) => {
        const partNumber = index + 1;
        const title =
            index === 0
                ? normalizedTitle
                : normalizedTitle
                  ? `${normalizedTitle}${suffixBuilder(partNumber)}`
                  : `Part ${partNumber}`;

        return {
            content: chunk,
            title,
            chapterSubNumber: baseSubNumber + index,
            partNumber,
        };
    });
}

function findBestSplitIndex(
    content: string,
    rangeStart: number,
    rangeEnd: number
): number | null {
    if (rangeStart >= rangeEnd) return null;

    const paragraphBreak = findLastDelimiterEnd(
        content,
        rangeStart,
        rangeEnd,
        '\n\n'
    );
    if (paragraphBreak !== null) return paragraphBreak;

    const lineBreak = findLastDelimiterEnd(content, rangeStart, rangeEnd, '\n');
    if (lineBreak !== null) return lineBreak;

    const sentenceBreak = findLastDelimiterEnd(
        content,
        rangeStart,
        rangeEnd,
        '. '
    );
    if (sentenceBreak !== null) return sentenceBreak;

    return findLastWhitespaceEnd(content, rangeStart, rangeEnd);
}

function findLastDelimiterEnd(
    content: string,
    rangeStart: number,
    rangeEnd: number,
    delimiter: string
): number | null {
    if (rangeStart >= rangeEnd) return null;

    const searchEnd = Math.min(content.length - 1, rangeEnd - 1);
    const index = content.lastIndexOf(delimiter, searchEnd);

    if (index < rangeStart) {
        return null;
    }

    return index + delimiter.length;
}

function findLastWhitespaceEnd(
    content: string,
    rangeStart: number,
    rangeEnd: number
): number | null {
    const start = Math.max(0, rangeStart);
    const end = Math.min(content.length, rangeEnd);

    for (let i = end - 1; i >= start; i -= 1) {
        if (isWhitespace(content.charAt(i))) {
            return i + 1;
        }
    }

    return null;
}

function isWhitespace(char: string) {
    return char === ' ' || char === '\n' || char === '\r' || char === '\t';
}
