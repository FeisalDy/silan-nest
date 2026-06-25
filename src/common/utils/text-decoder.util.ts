import iconv from 'iconv-lite';
import * as jschardet from 'jschardet';

const FALLBACK_ENCODINGS = ['utf8', 'gb18030', 'gbk', 'gb2312', 'big5'];
const SAMPLE_SIZE = 10240;

export class TextDecoderUtil {
    static decode(buffer: Buffer): string {
        const sampleBuffer =
            buffer.length > SAMPLE_SIZE
                ? buffer.subarray(0, SAMPLE_SIZE)
                : buffer;

        const detected = jschardet.detect(sampleBuffer);
        const candidates = [
            detected.encoding?.toLowerCase(),
            ...FALLBACK_ENCODINGS,
        ].filter(Boolean);

        let bestEncoding = 'utf8';

        for (const encoding of candidates) {
            if (!iconv.encodingExists(encoding)) {
                continue;
            }

            const sampleDecoded = iconv.decode(sampleBuffer, encoding);

            if (this.looksValid(sampleDecoded)) {
                bestEncoding = encoding;
                break;
            }
        }

        return iconv.decode(buffer, bestEncoding);
    }

    private static looksValid(text: string): boolean {
        let garbageCount = 0;
        const garbageRegex = /[Ãâèåæ]/;

        for (let i = 0; i < text.length; i++) {
            if (garbageRegex.test(text[i])) {
                garbageCount++;
                if (garbageCount >= 10) return false;
            }
        }

        return /[的一是不了人我在有他这为之大来以个中上们]/.test(text);
    }
}
