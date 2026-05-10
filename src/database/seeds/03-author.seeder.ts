import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';

import {Author} from '@/modules/novels/entities/author.entity';

export default class AuthorSeeder implements Seeder {
  async run(dataSource:DataSource, factoryManage: SeederFactoryManager){
    const authorFactory = factoryManage.get(Author);

    await authorFactory.saveMany(5)
  }
}