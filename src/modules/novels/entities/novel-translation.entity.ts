import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Novel } from './novel.entity';
import { Lang } from '@/common/constants/lang.constant';

@Entity('novel_translations')
@Unique(['novelId', 'languageCode'])
export class NovelTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'novel_id' })
  novelId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({
    name: 'language_code',
    type: 'enum',
    enum: Lang,
  })
  languageCode: Lang;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  synopsis: string | null;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @ManyToOne(() => Novel, (novel: Novel) => novel.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'novel_id' })
  novel: Novel;
}
