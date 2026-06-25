export function parseChineseChapterNumber(str: string): number {
    if (/^\d+$/.test(str)) {
        return parseInt(str, 10);
    }

    const map: Record<string, number> = {
        零: 0,
        一: 1,
        二: 2,
        两: 2,
        三: 3,
        四: 4,
        五: 5,
        六: 6,
        七: 7,
        八: 8,
        九: 9,
        十: 10,
        百: 100,
        千: 1000,
        万: 10000,
    };

    const result = 0;
    let section = 0;
    let number = 0;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const val = map[char];
        if (val === undefined) continue;

        if (val === 10000) {
            if (number === 0 && section === 0) number = 1;
            section = (section + number) * 10000;
            number = 0;
        } else if (val >= 10) {
            if (number === 0) number = 1;
            section += number * val;
            number = 0;
        } else {
            number = val;
        }
    }

    return result + section + number;
}
