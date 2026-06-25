import slugify from 'slugify';
import { pinyin } from 'pinyin';

export function BuildSlug(title: string) {
    const base = /\p{Script=Han}/u.test(title)
        ? pinyin(title, { style: 'normal' }).flat().join(' ')
        : title;

    const slug = slugify(base, {
        lower: true,
        strict: true,
        trim: true,
    });

    return slug;
}
