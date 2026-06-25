import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';

import { Chapter } from '@/modules/novels/entities/chapter.entity';
import { ChapterTranslation } from '@/modules/novels/entities/chapter-translation.entity';
import { Lang } from '@/common/constants/lang.constant';

export default class ChapterTranslationSeeder implements Seeder {
    async run(dataSource: DataSource, factoryManager: SeederFactoryManager) {
        const chapterRepository = dataSource.getRepository(Chapter);
        const translationRepository =
            dataSource.getRepository(ChapterTranslation);

        const chapters = await chapterRepository.find();
        const chapterTranslationFactory =
            factoryManager.get(ChapterTranslation);

        const chunkSize = 500;

        for (let i = 0; i < chapters.length; i += chunkSize) {
            const chunk = chapters.slice(i, i + chunkSize);
            const chunkTranslations: ChapterTranslation[] = [];

            await Promise.all(
                chunk.map(async (chapter) => {
                    for (const lang of Object.values(Lang)) {
                        const translation =
                            await chapterTranslationFactory.make({
                                chapterId: chapter.id,
                                chapter,
                                languageCode: lang,
                                isDefault: lang === Lang.CHINESE_PRC,
                            });
                        chunkTranslations.push(translation);
                    }
                })
            );

            await translationRepository.save(chunkTranslations);
        }
    }
}
