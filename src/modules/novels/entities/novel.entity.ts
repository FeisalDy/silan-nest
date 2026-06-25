import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Author } from './author.entity';
import { NovelTranslation } from './novel-translation.entity';
import { NovelAlias } from './novel-alias.entity';
import { Chapter } from './chapter.entity';
import { NovelType } from '@/common/constants/novel-type.constant';

@Entity('novels')
export class Novel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'author_id', nullable: true })
    authorId: string | null;

    @Column({ name: 'cover_url', type: 'varchar', length: 255, nullable: true })
    coverUrl: string | null;

    @Column({
        name: 'novel_type',
        type: 'enum',
        enum: NovelType,
        default: NovelType.SERIAL,
    })
    novelType!: NovelType;

    @Column({ type: 'varchar', length: 50, nullable: true })
    status: string | null;

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
        (translation: NovelTranslation) => translation.novel
    )
    translations: NovelTranslation[];

    @OneToMany(() => NovelAlias, (alias: NovelAlias) => alias.novel)
    aliases: NovelAlias[];

    @OneToMany(() => Chapter, (chapter: Chapter) => chapter.novel)
    chapters: Chapter[];
}
