import { setSeederFactory } from 'typeorm-extension';
import { NovelAlias } from '@/modules/novels/entities/novel-alias.entity';

export default setSeederFactory(NovelAlias, (faker)=>{
  const alias = new NovelAlias();

  alias.aliasTitle = faker.book.title()

  return alias;
})