import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NovelsModule } from './modules/novels/novels.module';
import { BullmqInfrastructureModule } from './infrastructure/bullmq/bullmq.module';
import { APP_GUARD } from '@nestjs/core';
import { SessionGuard } from './modules/auth/guards/session.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { JobsModule } from '@/modules/jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),
    BullmqInfrastructureModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    NovelsModule,
    JobsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
