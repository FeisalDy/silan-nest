import { Lang } from '@/common/constants/lang.constant';
import { ParserDefinition } from '../engine/parser-definition';

const TITLE_RE = /^书籍名称：(.+)$/m;
const AUTHOR_RE = /^作者名称：(.+)$/m;
const STATUS_RE = /^是否完结：(.+)$/m;
const CHAPTER_HEADING_RE = /^第\s*(\d+)\s*章\s*(.+)$/m;

const mapStatus = (status: string | null) => {
  if (!status) return null;
  if (status.includes('未完')) return 'ongoing';
  if (status.includes('完结')) return 'completed';
  return null;
};

export const sfacgMetaChapterV1Definition: ParserDefinition = {
  formatId: 'sfacg-meta-chapter-v1',
  languageCode: Lang.CHINESE_PRC,
  matchScore: (text: string) => {
    let score = 0;

    if (TITLE_RE.test(text)) {
      score += 15;
    }

    if (AUTHOR_RE.test(text)) {
      score += 20;
    }

    if (STATUS_RE.test(text)) {
      score += 25;
    }

    if (CHAPTER_HEADING_RE.test(text)) {
      score += 40;
    }

    return score;
  },
  metadata: {
    title: {
      type: 'regex',
      regex: TITLE_RE,
    },
    author: {
      type: 'regex',
      regex: AUTHOR_RE,
    },
    status: {
      type: 'regex',
      regex: STATUS_RE,
      transform: (value) => mapStatus(value),
    },
  },
  chapter: {
    heading: {
      regex: CHAPTER_HEADING_RE,
      numberGroup: 1,
      titleGroup: 2,
    },
    numberParser: (raw) => parseInt(raw, 10),
    volume: {
      startAt: 1,
      incrementOnReset: true,
    },
  },
};

