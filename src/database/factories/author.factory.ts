import { setSeederFactory } from 'typeorm-extension';
import { Author } from '@/modules/novels/entities/author.entity';

export default setSeederFactory(Author, (faker) => {
    const author = new Author();

    author.photoUrl = faker.image.avatar();

    return author;
});
