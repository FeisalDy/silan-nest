import { SfacgMetaChapterV1Parser } from './sfacg-meta-chapter-v1.parser';
import { loadFixture } from './__tests__/helpers/parser-test.helper';

describe('SfacgMetaChapterV1Parser', () => {
  const parser = new SfacgMetaChapterV1Parser();

  it('should parse sfacg meta chapter novel', () => {
    const text = loadFixture('sfacg-meta-chapter-v1.fixture.txt');

    const result = parser.parse(text);

    expect(result.title).toBe('魔王大人即使变身也要复仇哟');
    expect(result.author).toBe('兰玉边');
    expect(result.status).toBe('ongoing');

    expect(result.chapters).toHaveLength(2);

    expect(result.chapters[0]).toMatchObject({
      chapterNumber: 1,
      volumeNumber: 1,
      title: '第一章 怎么是你',
    });
  });
});
