export class RegexUtils {
  static safeExec(regex: RegExp, text: string): RegExpExecArray | null {
    const flags = regex.flags.replace('g', '');
    const safe = new RegExp(regex.source, flags);
    return safe.exec(text);
  }

  static toGlobal(regex: RegExp): RegExp {
    const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
    return new RegExp(regex.source, flags);
  }
}

