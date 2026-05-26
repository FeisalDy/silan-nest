import { UnknownMetaChapterV1Parser } from './unknown-meta-chapter-v1.parser';
import { loadFixture } from './__tests__/helpers/parser-test.helper';

describe('UnknownMetaChapterV1Parser', () => {
  const parser = new UnknownMetaChapterV1Parser();

  it('should parse unknown meta chapter', () => {
    const text = loadFixture('unknown-meta-chapter-v1.fixture.txt');

    const result = parser.parse(text);

    expect(result.title).toBe('当成为小姐姐之后');
    expect(result.author).toBe('吞噬药师的宝木德里奇');
    const normalize = (s: string) =>
      s
        .replace(/\r\n/g, '\n')
        .replace(/\u3000/g, ' ') // full-width space
        .trim();

    expect(normalize(result.synopsis!)).toBe(
      normalize(`（提醒：本书超慢热，超超超慢热，心急的会遭不住）
首先，本书和火辣又纯情的御姐库巴姬没有关系（震声！）
但是变成小姐姐这件事情就非常有趣了。
当成为小姐姐之后会发生什么？
哈？嫁人？怎么可能！
当然是开开心心地买一大堆游戏然后嗨起来啊！
小哥哥开黑吗？我御姐音哦！嘤嘤嘤~
小姐姐，你看我也是小姐姐，我们一起做个SPA怎样？我请客哇！
沙雕群友们，本群主的女装照片拿去，快拿去给别的群主施压！
可爱就是正义，颜值成了真理。
有时候会感叹，这个世界对于小姐姐真是宽容啊……
备注：本书别名《关于全世界都知道我家产业但就我不知道的二三事》`)
    );
    expect(result.chapters).toHaveLength(3);

    expect(result.chapters[0]).toMatchObject({
      chapterNumber: 1,
      volumeNumber: 0,
      title: '当成为小姐姐之后',
    });
    expect(result.chapters[1]).toMatchObject({
      chapterNumber: 1,
      volumeNumber: 1,
      title: '异域活动日记',
    });
  });
});
