import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';

import { Novel } from '@/modules/novels/entities/novel.entity';
import { NovelAlias } from '@/modules/novels/entities/novel-alias.entity';

export default class NovelAliasSeeder implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager
  ): Promise<void> {
    const novelRepository = dataSource.getRepository(Novel);
    const aliasRepository = dataSource.getRepository(NovelAlias);

    const novels = await novelRepository.find();

    const novelAliasFactory = factoryManager.get(NovelAlias);

    const aliases: NovelAlias[] = [];

    for (const novel of novels) {
      const aliasCount = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < aliasCount; i++) {
        const alias = await novelAliasFactory.make({
          novel,
        });

        aliases.push(alias);
      }
    }

    await aliasRepository.save(aliases);
  }
}
