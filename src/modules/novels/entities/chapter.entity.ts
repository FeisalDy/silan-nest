import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Novel } from './novel.entity.js';
import { ChapterTranslation } from './chapter-translation.entity.js';

@Entity('chapters')
@Unique(['novelId', 'volumeNumber', 'chapterNumber', 'chapterSubNumber'])
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'novel_id' })
  novelId: string;

  @Column({ name: 'chapter_number', type: 'integer' })
  chapterNumber: number;

  @Column({ name: 'chapter_sub_number', type: 'integer', default: 0 })
  chapterSubNumber: number;

  @Column({ name: 'volume_number', type: 'integer', default: 1 })
  volumeNumber: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Novel, (novel: Novel) => novel.chapters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'novel_id' })
  novel: Novel;

  @OneToMany(
    () => ChapterTranslation,
    (translation: ChapterTranslation) => translation.chapter,
  )
  translations: ChapterTranslation[];
}
