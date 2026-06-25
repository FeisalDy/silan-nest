export const normalizeSynopsis = (value: string) =>
    value
        .split(/\r?\n/)
        .map((line) => line.replace(/[ \t]+$/g, ''))
        .filter((line) => line.trim().length > 0)
        .join('\n')
        .trim();
