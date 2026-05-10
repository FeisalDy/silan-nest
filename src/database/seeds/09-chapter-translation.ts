import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';

import {Chapter} from '@/modules/novels/entities/chapter.entity';
import {ChapterTranslation} from '@/modules/novels/entities/chapter-translation.entity';
import {Lang} from '@/common/constants/lang.constant';

export default class ChapterTranslationSeeder implements Seeder {
  async run(dataSource: DataSource, factoryManager: SeederFactoryManager) {
    const chapterRepository = dataSource.getRepository(Chapter);

    const chapters = await chapterRepository.find();

    const chapterTranslationFactory = factoryManager.get(ChapterTranslation);

    const translations: ChapterTranslation[] = [];

    for (const chapter of chapters) {
      for (const lang of Object.values(Lang)) {
        translations.push(
          await chapterTranslationFactory.make({
            chapterId: chapter.id,
            chapter,
            languageCode: lang,
            isDefault: lang === Lang.CHINESE_PRC,
          })
        );
      }
    }

    await dataSource.getRepository(ChapterTranslation).save(translations);
  }
}