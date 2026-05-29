import { ParserDefinition } from '../engine/parser-definition';
import { genericCnChapterV1Definition } from './generic-cn-chapter-v1.definition';
import { sfacgMetaChapterV1Definition } from './sfacg-meta-chapter-v1.definition';
import { unknownMetaChapterV1Definition } from './unknown-meta-chapter-v1.definition';

export const parserDefinitions: ParserDefinition[] = [
  genericCnChapterV1Definition,
  sfacgMetaChapterV1Definition,
  unknownMetaChapterV1Definition,
];

export {
  genericCnChapterV1Definition,
  sfacgMetaChapterV1Definition,
  unknownMetaChapterV1Definition,
};

