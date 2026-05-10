import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';

import { Lang } from '@/common/constants/lang.constant';
import {NovelTranslation} from '@/modules/novels/entities/novel-translation.entity';
import {Novel} from '@/modules/novels/entities/novel.entity';

export default class NovelTranslationSeeder implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager
  ) {
    const novelRepository = dataSource.getRepository(Novel);

    const novels = await novelRepository.find();

    const novelTranslationFactory = factoryManager.get(NovelTranslation);

    const translations: NovelTranslation[] = [];

    for (const novel of novels) {
      for (const lang of Object.values(Lang)) {
        translations.push(
          await novelTranslationFactory.make({
            novelId: novel.id,
            novel,
            languageCode: lang,
            isDefault: lang === Lang.CHINESE_PRC,
          })
        );
      }
    }

    await dataSource.getRepository(NovelTranslation).save(translations);
  }
}