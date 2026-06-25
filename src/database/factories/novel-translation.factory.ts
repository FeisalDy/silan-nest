import { setSeederFactory } from 'typeorm-extension';
import { NovelTranslation } from '@/modules/novels/entities/novel-translation.entity';
import { BuildSlug } from '@/common/utils/build-novel-slug.util';

export default setSeederFactory(NovelTranslation, (faker) => {
    const translation = new NovelTranslation();

    translation.title = faker.book.title();
    translation.synopsis = faker.lorem.paragraphs(
        Math.floor(Math.random() * 5)
    );
    translation.isDefault = false;

    translation.slug = BuildSlug(translation.title);

    return translation;
});
