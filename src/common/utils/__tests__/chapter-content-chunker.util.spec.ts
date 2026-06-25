import {
    BuildChunkedChapterParts,
    ChunkChapterContent,
} from '@/common/utils/chapter-content-chunker.util';

describe('ChunkChapterContent', () => {
    it('keeps content under limit in a single chunk', () => {
        const content = 'Short chapter.';

        const chunks = ChunkChapterContent(content, { maxLength: 20000 });

        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toBe(content);
    });

    it('splits near paragraph breaks within buffer', () => {
        const content = `${'a'.repeat(19000)}\n\n${'b'.repeat(5000)}`;

        const chunks = ChunkChapterContent(content, {
            maxLength: 20000,
            breakBuffer: 2000,
        });

        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks[0].endsWith('\n\n')).toBe(true);
        expect(chunks[0].length).toBeLessThanOrEqual(22000);
    });

    it('falls back to whitespace when no newline is available', () => {
        const content = 'word '.repeat(5000).trim();

        const chunks = ChunkChapterContent(content, {
            maxLength: 20000,
            breakBuffer: 2000,
        });

        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks[0].charAt(chunks[0].length - 1)).toBe(' ');
    });
});

describe('BuildChunkedChapterParts', () => {
    it('increments chapterSubNumber and appends title suffix for continuation', () => {
        const content = 'word '.repeat(3000).trim();

        const parts = BuildChunkedChapterParts({
            title: 'Chapter One',
            content,
            baseSubNumber: 1,
            options: { maxLength: 8000, breakBuffer: 500 },
        });

        expect(parts.length).toBeGreaterThan(1);
        expect(parts[0].chapterSubNumber).toBe(1);
        expect(parts[1].chapterSubNumber).toBe(2);
        expect(parts[0].title).toBe('Chapter One');
        expect(parts[1].title).toBe('Chapter One (Part 2)');
    });

    it('uses generic part titles when the base title is missing', () => {
        const content = 'word '.repeat(3000).trim();

        const parts = BuildChunkedChapterParts({
            title: '',
            content,
            options: { maxLength: 8000, breakBuffer: 500 },
        });

        expect(parts[0].title).toBeNull();
        expect(parts[1].title).toBe('Part 2');
    });
});
