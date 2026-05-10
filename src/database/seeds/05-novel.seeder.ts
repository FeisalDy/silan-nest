import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Novel } from '@/modules/novels/entities/novel.entity';
import { Author } from '@/modules/novels/entities/author.entity';
export default class NovelSeeder implements Seeder {
  async run(dataSource:DataSource, factoryManage: SeederFactoryManager){
    const authorRepository = dataSource.getRepository(Author);
    const authors = await authorRepository.find();

    const novelFactory = factoryManage.get(Novel);

    const novel: Novel[] = [];

    for(const author of authors){
      novel.push(
        await novelFactory.make({
          authorId: author.id,
          author,
        })
      );
    }
    await dataSource.getRepository(Novel).save(novel);
  }
}