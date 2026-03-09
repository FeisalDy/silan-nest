import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Author } from './author.entity.js';
import { NovelTranslation } from './novel-translation.entity.js';
import { NovelAlias } from './novel-alias.entity.js';
import { Chapter } from './chapter.entity.js';

@Entity('novels')
export class Novel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'author_id', nullable: true })
  authorId: string | null;

  @Column({ name: 'cover_url', type: 'varchar', length: 255, nullable: true })
  coverUrl: string | null;

  @Column({ type: 'varchar', length: 50, default: 'completed' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Author, (author: Author) => author.novels, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'author_id' })
  author: Author | null;

  @OneToMany(
    () => NovelTranslation,
    (translation: NovelTranslation) => translation.novel,
  )
  translations: NovelTranslation[];

  @OneToMany(() => NovelAlias, (alias: NovelAlias) => alias.novel)
  aliases: NovelAlias[];

  @OneToMany(() => Chapter, (chapter: Chapter) => chapter.novel)
  chapters: Chapter[];
}
