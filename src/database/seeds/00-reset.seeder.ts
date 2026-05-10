import type { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';

export default class ResetSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    await dataSource.query(`
      TRUNCATE TABLE
        users,
        password_reset_tokens,
        sessions,
        roles,
        author_translations,
        authors,
        novels,
        novel_translations,
        novel_aliases,
        chapters,
        chapter_translations
      RESTART IDENTITY CASCADE;
    `);
  }
}
