import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';

import { Chapter } from '@/modules/novels/entities/chapter.entity';
import { Novel } from '@/modules/novels/entities/novel.entity';

export default class ChapterSeeder implements Seeder {
    async run(dataSource: DataSource): Promise<void> {
        const novelRepository = dataSource.getRepository(Novel);
        const chapterRepository = dataSource.getRepository(Chapter);

        const novels = await novelRepository.find();

        const chapters: Chapter[] = [];

        for (const novel of novels) {
            // 20 - 300 chapters
            const totalChapters =
                Math.floor(Math.random() * (300 - 20 + 1)) + 20;

            // some novels only volume 1
            const useVolumes = Math.random() > 0.5;

            // 1 - 10 volumes if enabled
            const totalVolumes = useVolumes
                ? Math.floor(Math.random() * 10) + 1
                : 1;

            let currentVolume = 1;

            for (
                let chapterNum = 1;
                chapterNum <= totalChapters;
                chapterNum++
            ) {
                // distribute volumes
                if (useVolumes) {
                    const chaptersPerVolume = Math.ceil(
                        totalChapters / totalVolumes
                    );

                    currentVolume = Math.min(
                        Math.floor((chapterNum - 1) / chaptersPerVolume) + 1,
                        totalVolumes
                    );
                }

                // normal chapter
                const chapter = chapterRepository.create({
                    novelId: novel.id,
                    novel,
                    chapterNumber: chapterNum,
                    chapterSubNumber: 0,
                    volumeNumber: currentVolume,
                });

                chapters.push(chapter);

                // rare sub chapter
                // example: 10.1 between 10 and 11
                const shouldCreateSubChapter = Math.random() < 0.12;

                if (shouldCreateSubChapter) {
                    const subChapterCount = Math.floor(Math.random() * 2) + 1;

                    for (let sub = 1; sub <= subChapterCount; sub++) {
                        const subChapter = chapterRepository.create({
                            novelId: novel.id,
                            novel,
                            chapterNumber: chapterNum,
                            chapterSubNumber: sub,
                            volumeNumber: currentVolume,
                        });

                        chapters.push(subChapter);
                    }
                }
            }
        }

        const chunkSize = 500;
        for (let i = 0; i < chapters.length; i += chunkSize) {
            await chapterRepository.save(chapters.slice(i, i + chunkSize));
        }
    }
}
