import { ParserDefinition } from '../engine/parser-definition';
import { genericCnChapterV1Definition } from './generic-cn-chapter-v1.definition';
import { genericCnChapterV2Definition } from './generic-cn-chapter-v2.definition';
import { sfacgMetaChapterV1Definition } from './sfacg-meta-chapter-v1.definition';
import { unknownMetaChapterV1Definition } from './unknown-meta-chapter-v1.definition';
import { xsqishuMetaChapterV1Definition } from './xsqishu-meta-chapter-v1.defination';
export const parserDefinitions: ParserDefinition[] = [
    genericCnChapterV1Definition,
    genericCnChapterV2Definition,
    sfacgMetaChapterV1Definition,
    unknownMetaChapterV1Definition,
    xsqishuMetaChapterV1Definition,
];

export {
    genericCnChapterV1Definition,
    genericCnChapterV2Definition,
    sfacgMetaChapterV1Definition,
    unknownMetaChapterV1Definition,
    xsqishuMetaChapterV1Definition,
};
