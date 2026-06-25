import 'dotenv/config';
import { DataSourceOptions } from 'typeorm';
import { isTruthyEnv } from '@/common/utils/is-truthy-env.util';

const isProduction = isTruthyEnv(process.env.PRODUCTION);

export const typeOrmConfig: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: !isProduction && isTruthyEnv(process.env.DB_SYNC),
    logging: !isProduction && isTruthyEnv(process.env.DB_VERBOSE),
};
