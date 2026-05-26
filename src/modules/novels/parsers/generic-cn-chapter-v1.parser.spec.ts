import { GenericCnChapterV1Parser } from './generic-cn-chapter-v1.parser';
import { loadFixture } from './__tests__/helpers/parser-test.helper';

describe('GenericCnChapterV1Parser', () => {
  const parser = new GenericCnChapterV1Parser();

  it('should parse generic cn chapter', () => {
    const text = loadFixture('generic-cn-chapter-v1.fixture.txt');

    const result = parser.parse(text);

    expect(result.chapters).toHaveLength(2);

    expect(result.chapters[0]).toMatchObject({
      chapterNumber: 1,
      volumeNumber: 1,
      title: '序幕',
    });
  });
});
