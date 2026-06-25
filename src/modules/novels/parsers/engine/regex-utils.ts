export class RegexUtils {
    static safeTest(regex: RegExp, text: string): boolean {
        return this.stripStatefulFlags(regex).test(text);
    }

    static safeExec(regex: RegExp, text: string): RegExpExecArray | null {
        return this.stripStatefulFlags(regex).exec(text);
    }

    static toGlobal(regex: RegExp): RegExp {
        const flags = this.stripFlags(regex.flags, ['g', 'y']);
        return new RegExp(regex.source, `${flags}g`);
    }

    private static stripStatefulFlags(regex: RegExp): RegExp {
        const flags = this.stripFlags(regex.flags, ['g', 'y']);
        return new RegExp(regex.source, flags);
    }

    private static stripFlags(flags: string, remove: string[]): string {
        return flags
            .split('')
            .filter((flag) => !remove.includes(flag))
            .join('');
    }
}
