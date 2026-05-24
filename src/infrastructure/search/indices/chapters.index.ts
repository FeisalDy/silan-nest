import { estypes } from '@elastic/elasticsearch';

export const CHAPTER_TRANSLATION_INDEX = 'chapter_translations';

export const chapterIndexSettings: estypes.IndicesCreateRequest = {
  index: CHAPTER_TRANSLATION_INDEX,

  mappings: {
    properties: {
      id: {
        type: 'keyword',
      },

      chapterId: {
        type: 'keyword',
      },

      content: {
        type: 'text',
      },

      languageCode: {
        type: 'keyword',
      },
    },
  },
};