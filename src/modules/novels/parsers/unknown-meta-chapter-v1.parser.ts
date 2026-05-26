import { Injectable } from '@nestjs/common';
import {
  NovelParser,
  ParsedNovel,
  ParsedChapter,
} from '../interfaces/parsed-novel.interface';
import { Lang } from '@/common/constants/lang.constant';

@Injectable()
export class UnknownMetaChapterV1Parser implements NovelParser {
  readonly formatId = 'unknown-meta-chapter-v1';

  match(text: string) {
    return 0;
  }

  parse(text: string, chapterLimit?: number): ParsedNovel {
    return {
      title: null,
      author: null,
      status: null,
      synopsis: null,
      chapters: [],
      languageCode: Lang.CHINESE_PRC,
    };
  }
}
