import { setSeederFactory } from 'typeorm-extension';
import {ChapterTranslation} from '@/modules/novels/entities/chapter-translation.entity';

export default setSeederFactory(ChapterTranslation, (faker) => {
  const chapterTranslation = new ChapterTranslation();

  chapterTranslation.title = faker.word.words(Math.floor(Math.random() * 10))
  chapterTranslation.content = faker.lorem.paragraphs(Math.floor(Math.random() * (20 - 5 + 1)) + 5)
  chapterTranslation.isDefault = false;

  return chapterTranslation;
});