import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Author } from './entities/author.entity.js';
import { AuthorTranslation } from './entities/author-translation.entity.js';
import { AuthorsService } from './authors.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Author, AuthorTranslation])],
  providers: [AuthorsService],
  exports: [TypeOrmModule, AuthorsService],
})
export class AuthorsModule {}
