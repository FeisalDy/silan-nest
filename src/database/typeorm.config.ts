import 'dotenv/config';
import { DataSourceOptions } from 'typeorm';
import { isTruthyEnv } from '@/common/utils/is-truthy-env.util';

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: isTruthyEnv(process.env.DB_SYNC),
  logging: !isTruthyEnv(process.env.PRODUCTION),
};
