import iconv from 'iconv-lite';
import * as jschardet from 'jschardet';

const FALLBACK_ENCODINGS = ['utf8', 'gb18030', 'gbk', 'gb2312', 'big5'];

export class TextDecoderUtil {
  static decode(buffer: Buffer): string {
    const detected = jschardet.detect(buffer);

    const candidates = [
      detected.encoding?.toLowerCase(),
      ...FALLBACK_ENCODINGS,
    ].filter(Boolean);

    for (const encoding of candidates) {
      if (!iconv.encodingExists(encoding)) {
        continue;
      }

      const decoded = iconv.decode(buffer, encoding);

      if (this.looksValid(decoded)) {
        return decoded;
      }
    }

    return iconv.decode(buffer, 'utf8');
  }

  private static looksValid(text: string): boolean {
    const garbageMatches = text.match(/�|Ã|â|è|å|æ/g);

    const garbageCount = garbageMatches?.length ?? 0;

    const hasChinese = /[的一是不了人我在有他这为之大来以个中上们]/.test(text);

    return garbageCount < 10 && hasChinese;
  }
}
