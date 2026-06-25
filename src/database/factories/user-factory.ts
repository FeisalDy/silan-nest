import { setSeederFactory } from 'typeorm-extension';
import { User } from '@/modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export default setSeederFactory(User, async (faker) => {
    const user = new User();

    user.email = faker.internet.email().toLowerCase();
    user.username = faker.internet.username().toLowerCase();

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash('password', salt);

    user.isActive = true;
    user.isEmailVerified = true;

    return user;
});
