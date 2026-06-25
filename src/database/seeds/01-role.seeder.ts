import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';

import { Role } from '@/modules/auth/entities/role.entity';
import { Role as RoleEnum } from '@/common/constants/role.constant';

export default class RoleSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        const repository = dataSource.getRepository(Role);

        for (const roleName of Object.values(RoleEnum)) {
            const exists = await repository.findOne({
                where: { name: roleName },
            });

            if (!exists) {
                const role = repository.create({
                    name: roleName,
                });

                await repository.save(role);
            }
        }
    }
}
