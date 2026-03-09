import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Novel } from './novel.entity.js';

@Entity('novel_aliases')
@Unique(['novelId', 'aliasTitle'])
export class NovelAlias {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'novel_id' })
  novelId: string;

  @Column({ name: 'alias_title', type: 'varchar', length: 255 })
  aliasTitle: string;

  @Column({ name: 'language_code', type: 'varchar', length: 5, nullable: true })
  languageCode: string | null;

  @ManyToOne(() => Novel, (novel: Novel) => novel.aliases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'novel_id' })
  novel: Novel;
}
