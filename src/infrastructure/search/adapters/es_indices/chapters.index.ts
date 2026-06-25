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
                analyzer: 'standard',
            },

            // Because ik_smart is part of a community plugin hosted by INFINI Labs (formerly Medcl),
            // it isn't bundled with native Elasticsearch installations.
            // You must download the plugin matching your exact Elasticsearch server version.
            contentZh: {
                type: 'text',
                analyzer: 'ik_smart',
            },

            languageCode: {
                type: 'keyword',
            },
        },
    },
};
