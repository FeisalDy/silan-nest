/* eslint-disable no-irregular-whitespace */
import { ConfiguredNovelParser } from '../engine/configured-novel.parser';
import { ParserEngine } from '../engine/parser-engine';
import { MetadataExtractor } from '../engine/metadata-extractor';
import { ChapterBuilder } from '../engine/chapter-builder';
import { ChapterExtractor } from '../engine/chapter-extractor';
import { parserDefinitions } from '../definitions';
import { loadFixture, normalize } from './helpers/parser-test.helper';

interface ParserTestCase {
  formatId: string;
  fixture: string;
  assert: (result: ReturnType<ConfiguredNovelParser['parse']>) => void;
}

const cases: ParserTestCase[] = [
  {
    formatId: 'generic-cn-chapter-v1',
    fixture: 'generic-cn-chapter-v1.fixture.txt',
    assert: (result) => {
      expect(result.chapters).toHaveLength(2);
      expect(result.chapters[0]).toMatchObject({
        chapterNumber: 1,
        volumeNumber: 1,
        title: '序幕',
      });
    },
  },
  {
    formatId: 'sfacg-meta-chapter-v1',
    fixture: 'sfacg-meta-chapter-v1.fixture.txt',
    assert: (result) => {
      expect(result.title).toBe('魔王大人即使变身也要复仇哟');
      expect(result.author).toBe('兰玉边');
      expect(result.status).toBe('ongoing');
      expect(result.chapters).toHaveLength(2);
      expect(result.chapters[0]).toMatchObject({
        chapterNumber: 1,
        volumeNumber: 1,
        title: '第一章 怎么是你',
      });
    },
  },
  {
    formatId: 'unknown-meta-chapter-v1',
    fixture: 'unknown-meta-chapter-v1.fixture.txt',
    assert: (result) => {
      expect(result.title).toBe('当成为小姐姐之后');
      expect(result.author).toBe('吞噬药师的宝木德里奇');

      expect(normalize(result.synopsis ?? '')).toBe(
        normalize(`首先，本书和火辣又纯情的御姐库巴姬没有关系（震声！）
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
    },
  },
  {
    formatId: 'xsqishu-meta-chapter-v1',
    fixture: 'xsqishu-meta-chapter-v1.fixture.txt',
    assert: (result) => {
      expect(result.title).toBe('希灵帝国');
      expect(result.author).toBe('远瞳');
      expect(normalize(result.synopsis ?? '')).toBe(
        normalize(` 不是帝国争霸，不是异界风云，更不是升级练功，其实，这是一本非常严肃正经认真的硬科幻救世文——你就当真的听。
　　好吧，其实这就是一群没溜的领袖和一个坑爹的元首欢乐无节操的救世日常而已。
　　混吃等死的伪宅摇身一变成帝国元首，拥有奶爸光环的大叔领养萝莉无数，这就是某宅在获得一个从天而降的蹭饭兵团之后所发生的爆笑故事，再次郑重提示：这是一本非常严肃正经认真的科幻…… `)
      );
      expect(result.chapters).toHaveLength(2);
      expect(result.chapters[0]).toMatchObject({
        chapterNumber: 1,
        volumeNumber: 1,
        title: '梦',
      });
    },
  },
];

describe('Novel parsers', () => {
  const metadataExtractor = new MetadataExtractor();
  const chapterBuilder = new ChapterBuilder();
  const chapterExtractor = new ChapterExtractor(chapterBuilder);
  const engine = new ParserEngine(metadataExtractor, chapterExtractor);

  describe.each(cases)('$formatId', ({ formatId, fixture, assert }) => {
    it('parses fixture text', () => {
      const definition = parserDefinitions.find(
        (item) => item.formatId === formatId
      );
      if (!definition) {
        throw new Error(`Missing parser definition for ${formatId}`);
      }

      const parser = new ConfiguredNovelParser(definition, engine);
      const text = loadFixture(fixture);
      const result = parser.parse(text);

      assert(result);
    });
  });
});
