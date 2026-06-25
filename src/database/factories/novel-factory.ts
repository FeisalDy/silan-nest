import { setSeederFactory } from 'typeorm-extension';
import { Novel } from '@/modules/novels/entities/novel.entity';

export default setSeederFactory(Novel, (faker) => {
    const novel = new Novel();

    novel.coverUrl = faker.image.urlPicsumPhotos();

    return novel;
});
