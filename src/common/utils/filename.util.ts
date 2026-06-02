export class FilenameUtil {
  static normalize(filename: string): string {
    if (!filename) {
      return filename;
    }

    // Already contains readable CJK characters.
    // Do not attempt repair.
    if (this.hasReadableUnicode(filename)) {
      return filename;
    }

    const repaired = this.tryLatin1ToUtf8(filename);

    if (this.score(repaired) > this.score(filename)) {
      return repaired;
    }

    return filename;
  }

  private static tryLatin1ToUtf8(filename: string): string {
    try {
      return Buffer.from(filename, 'latin1').toString('utf8');
    } catch {
      return filename;
    }
  }

  private static hasReadableUnicode(text: string): boolean {
    return (
      /[\u4e00-\u9fff]/.test(text) || // Chinese
      /[\u3040-\u30ff]/.test(text) || // Japanese
      /[\uac00-\ud7af]/.test(text) // Korean
    );
  }

  private static score(text: string): number {
    let score = 0;

    // CJK is usually a good sign for your use case
    if (/[\u4e00-\u9fff]/.test(text)) score += 20;
    if (/[\u3040-\u30ff]/.test(text)) score += 20;
    if (/[\uac00-\ud7af]/.test(text)) score += 20;

    // Common mojibake markers
    score -= (text.match(/[ÃÂ�]/g) ?? []).length * 10;

    // Replacement character means decoding failed
    score -= (text.match(/�/g) ?? []).length * 20;

    return score;
  }
}
