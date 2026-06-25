export class NumberParser {
    static chapter(raw: string, parser: (value: string) => number): number {
        return parser(raw);
    }

    static chapterSub(raw: string, parser?: (value: string) => number): number {
        if (!parser) {
            return parseInt(raw, 10) || 0;
        }

        return parser(raw);
    }
}
