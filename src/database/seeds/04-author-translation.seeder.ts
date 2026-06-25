import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';

import { AuthorTranslation } from '@/modules/novels/entities/author-translation.entity';
import { Author } from '@/modules/novels/entities/author.entity';

import { Lang } from '@/common/constants/lang.constant';

export default class AuthorTranslationSeeder implements Seeder {
    async run(
        dataSource: DataSource,
        factoryManager: SeederFactoryManager
    ): Promise<void> {
        const authorRepository = dataSource.getRepository(Author);

        const authors = await authorRepository.find();

        const authorTranslationFactory = factoryManager.get(AuthorTranslation);

        const translations: AuthorTranslation[] = [];

        for (const author of authors) {
            for (const lang of Object.values(Lang)) {
                translations.push(
                    await authorTranslationFactory.make({
                        authorId: author.id,
                        author,
                        languageCode: lang,
                        isDefault: lang === Lang.CHINESE_PRC,
                    })
                );
            }
        }

        await dataSource.getRepository(AuthorTranslation).save(translations);
    }
}
