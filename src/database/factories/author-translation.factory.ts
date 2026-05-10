import { setSeederFactory } from 'typeorm-extension';
import {AuthorTranslation} from '@/modules/novels/entities/author-translation.entity';

export default setSeederFactory(AuthorTranslation, (faker)=>{
  const translation = new AuthorTranslation();

  translation.name = faker.person.fullName();

  translation.biography = faker.lorem.paragraphs(2);

  translation.isDefault = false;

  return translation
})