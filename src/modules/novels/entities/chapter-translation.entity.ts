import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Chapter } from './chapter.entity.js';

@Entity('chapter_translations')
@Unique(['chapterId', 'languageCode'])
export class ChapterTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chapter_id' })
  chapterId: string;

  @Column({ name: 'language_code', type: 'varchar', length: 5 })
  languageCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Chapter, (chapter: Chapter) => chapter.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;
}
