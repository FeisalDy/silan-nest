import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';

import { User } from '@/modules/users/entities/user.entity';
import { Role } from '@/modules/auth/entities/role.entity';

import { Role as RoleEnum } from '@/common/constants/role.constant';

export default class UserSeeder implements Seeder {
    async run(
        dataSource: DataSource,
        factoryManager: SeederFactoryManager
    ): Promise<void> {
        const roleRepository = dataSource.getRepository(Role);

        const adminRole = await roleRepository.findOneByOrFail({
            name: RoleEnum.ADMIN,
        });

        const userRole = await roleRepository.findOneByOrFail({
            name: RoleEnum.READER,
        });

        const userFactory = factoryManager.get(User);

        // admin
        await userFactory.save({
            email: 'admin@example.com',
            username: 'admin',
            roleId: adminRole.id,
            role: adminRole,
        });

        // readers
        await userFactory.saveMany(10, {
            roleId: userRole.id,
            role: userRole,
        });
    }
}
