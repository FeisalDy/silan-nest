import { parserDefinitions } from '../definitions';
import { loadFixture } from './helpers/parser-test.helper';

interface ScoreCase {
  formatId: string;
  fixture: string;
  expectedScore: number;
}

const cases: ScoreCase[] = [
  {
    formatId: 'generic-cn-chapter-v1',
    fixture: 'generic-cn-chapter-v1.fixture.txt',
    expectedScore: 5,
  },
  {
    formatId: 'generic-cn-chapter-v2',
    fixture: 'generic-cn-chapter-v2.fixture.txt',
    expectedScore: 5,
  },
  {
    formatId: 'sfacg-meta-chapter-v1',
    fixture: 'sfacg-meta-chapter-v1.fixture.txt',
    expectedScore: 165,
  },
  {
    formatId: 'unknown-meta-chapter-v1',
    fixture: 'unknown-meta-chapter-v1.fixture.txt',
    expectedScore: 81,
  },
  {
    formatId: 'xsqishu-meta-chapter-v1',
    fixture: 'xsqishu-meta-chapter-v1.fixture.txt',
    expectedScore: 111,
  },
];

describe('Parser match scores', () => {
  describe.each(cases)('$formatId', ({ formatId, fixture, expectedScore }) => {
    it('returns the expected score for the fixture', () => {
      const definition = parserDefinitions.find(
        (item) => item.formatId === formatId
      );
      if (!definition) {
        throw new Error(`Missing parser definition for ${formatId}`);
      }

      const text = loadFixture(fixture);
      const score = definition.matchScore(text);

      expect(score).toBe(expectedScore);
    });
  });
});

