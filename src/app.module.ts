import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthorsModule } from './modules/authors/authors.module.js';
import { NovelsModule } from './modules/novels/novels.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AuthorsModule,
    NovelsModule,
  ],
  controllers: [],
})
export class AppModule {}
