import { FilenameUtil } from '@/common/utils/filename.util';
import { NovelTitleGenerator } from '@/common/utils/novel-title-generator.util';
import { Injectable } from '@nestjs/common';
import { TextDecoderUtil } from '@/common/utils/text-decoder.util';
import { NovelParserRegistry } from '@/modules/novels/parsers/novel-parser.registry';

@Injectable()
export class NovelParserService {
  constructor(private readonly parserRegistry: NovelParserRegistry) {}
  previewNovelImport(
    file: Express.Multer.File,
    formatId?: string,
    chapterLimit?: number
  ) {
    const { parsedNovel, formatId: resolvedFormatId } = this.parseNovel(
      file,
      formatId,
      chapterLimit
    );

    if (!parsedNovel.title) {
      const cleanFileName = FilenameUtil.normalize(file.originalname);

      parsedNovel.title = NovelTitleGenerator.generate({
        fileName: cleanFileName,
        firstChapterTitle: parsedNovel.chapters[0]?.title,
        languageCode: parsedNovel.languageCode,
      });
    }

    return { parsedNovel, resolvedFormatId };
  }

  private parseNovel(
    file: Express.Multer.File,
    formatId?: string,
    chapterLimit?: number
  ) {
    // Limit the filesize to 64kb for format detection, so instead of O(file-size),
    // its O(256kb) which is much faster for large files and still enough for format detection
    const sample = TextDecoderUtil.decode(file.buffer.subarray(0, 64_000));

    const parser = formatId
      ? this.parserRegistry.getByFormatId(formatId)
      : this.parserRegistry.detect(sample);

    const fullText = TextDecoderUtil.decode(file.buffer);

    return {
      formatId: parser.formatId,
      parsedNovel: parser.parse(fullText, chapterLimit),
    };
  }
}
