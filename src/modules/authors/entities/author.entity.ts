import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuthorTranslation } from './author-translation.entity.js';
import { Novel } from '../../novels/entities/novel.entity.js';

@Entity('authors')
export class Author {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'photo_url', type: 'varchar', length: 255, nullable: true })
  photoUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(
    () => AuthorTranslation,
    (translation: AuthorTranslation) => translation.author,
  )
  translations: AuthorTranslation[];

  @OneToMany(() => Novel, (novel: Novel) => novel.author)
  novels: Novel[];
}
