import { estypes } from '@elastic/elasticsearch';

export const NOVELS_INDEX = 'novels';

export const novelsIndexSettings: estypes.IndicesCreateRequest = {
    index: NOVELS_INDEX,

    settings: {
        analysis: {
            analyzer: {
                default: {
                    type: 'standard',
                },
            },
        },
    },

    mappings: {
        properties: {
            id: {
                type: 'keyword',
            },

            slug: {
                type: 'keyword',
            },

            title: {
                type: 'text',
                analyzer: 'standard',
            },

            aliases: {
                type: 'text',
            },

            description: {
                type: 'text',
            },

            author: {
                type: 'text',
            },

            language: {
                type: 'keyword',
            },

            createdAt: {
                type: 'date',
            },
        },
    },
};
