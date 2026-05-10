// import { Global, Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { isTruthyEnv } from '@/common/utils/is-truthy-env.util';
//
// @Global()
// @Module({
//   imports: [
//     TypeOrmModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService) => ({
//         type: 'postgres',
//         host: configService.getOrThrow<string>('DB_HOST'),
//         port: Number(configService.getOrThrow<string>('DB_PORT')),
//         username: configService.getOrThrow<string>('DB_USERNAME'),
//         password: configService.getOrThrow<string>('DB_PASSWORD'),
//         database: configService.getOrThrow<string>('DB_DATABASE'),
//         entities: [__dirname + '/../**/*.entity{.ts,.js}'],
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
//         synchronize: isTruthyEnv(configService.getOrThrow<string>('DB_SYNC')),
//       }),
//     }),
//   ],
//   exports: [TypeOrmModule],
// })
// export class DatabaseModule {}

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './typeorm.config';

@Global()
@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig)],
})
export class DatabaseModule {}