import { Lang } from '@/common/constants/lang.constant';

const LOCALIZATION: Record<string, { untitled: string; novel: string }> = {
    en: { untitled: 'Untitled', novel: 'Untitled Novel' },
    'zh-cn': { untitled: '无标题', novel: '无标题小说' },
    zh: { untitled: '无标题', novel: '无标题小说' }, // Base fallback for any other Chinese region
    ja: { untitled: '無題', novel: '無題の小説' },
    es: { untitled: 'Sin título', novel: 'Novela sin título' },
};

function sanitizeFileName(fileName: string): string {
    if (!fileName) return '';
    // eslint-disable-next-line no-control-regex
    let sanitized = fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
    sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');
    return sanitized ? sanitized.slice(0, 255) : 'untitled';
}

export class NovelTitleGenerator {
    static generate(options: {
        fileName?: string;
        firstChapterTitle?: string;
        languageCode?: Lang | string; // 2. Allow the Lang enum or string
    }): string {
        // 3. Smart language resolution
        const langInput = (options.languageCode || '').toLowerCase();
        const baseLang = langInput.split('-')[0]; // e.g., "zh-cn" -> "zh"

        // Try exact match first (zh-cn), then base language (zh), then default (en)
        const t =
            LOCALIZATION[langInput] ||
            LOCALIZATION[baseLang] ||
            LOCALIZATION.en;

        // Case 1: Handle File Name
        if (options.fileName) {
            const nameWithoutExt = options.fileName.replace(/\.[^/.]+$/, '');
            const sanitized = sanitizeFileName(nameWithoutExt);

            if (sanitized !== 'untitled') {
                return sanitized;
            }
        }

        // Case 2: Fallback to Chapter Title
        if (options.firstChapterTitle) {
            const cleanChapter = options.firstChapterTitle.trim();
            if (cleanChapter) {
                return `${t.untitled} - ${cleanChapter}`;
            }
        }

        // Case 3: Ultimate fallback
        const uniqueId = Math.random().toString(36).substring(2, 7);
        const timestamp = Date.now();
        return `${t.novel} [${timestamp}-${uniqueId}]`;
    }
}
