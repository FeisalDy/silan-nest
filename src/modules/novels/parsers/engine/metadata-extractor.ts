import { Injectable } from '@nestjs/common';
import {
    MetadataBlockField,
    MetadataFieldDefinition,
    ParsedNovelMetadata,
    ParserDefinition,
} from './parser-definition';
import { RegexUtils } from './regex-utils';
import { ValueNormalizer } from './value-normalizer';

@Injectable()
export class MetadataExtractor {
    extract(
        text: string,
        definition: ParserDefinition,
        synopsisDefaultEnd?: RegExp
    ): ParsedNovelMetadata {
        const metadata: ParsedNovelMetadata = {
            title: null,
            author: null,
            synopsis: null,
            status: null,
        };

        if (!definition.metadata) {
            return metadata;
        }

        metadata.title = this.extractField(text, definition.metadata.title);
        metadata.author = this.extractField(text, definition.metadata.author);
        metadata.status = this.extractField(text, definition.metadata.status);
        metadata.synopsis = this.extractField(
            text,
            definition.metadata.synopsis,
            synopsisDefaultEnd
        );

        return metadata;
    }

    private extractField(
        text: string,
        field: MetadataFieldDefinition | undefined,
        defaultEndRegex?: RegExp
    ): string | null {
        if (!field) return null;

        if (field.type === 'regex') {
            const match = RegexUtils.safeExec(field.regex, text);
            if (!match) return null;
            const group = field.group ?? 1;
            const value = match[group] ?? '';
            return ValueNormalizer.clean(value, field.transform);
        }

        if (field.type === 'extractor') {
            const value = field.extractor(text);
            if (!value) return null;
            return ValueNormalizer.clean(value, field.transform);
        }

        const blockField: MetadataBlockField = field;
        const startMatch = RegexUtils.safeExec(blockField.start, text);
        if (!startMatch) return null;

        const startIndex = startMatch.index + startMatch[0].length;
        const afterStart = text.slice(startIndex);
        const endRegex = blockField.end ?? defaultEndRegex;

        let body = afterStart;
        if (endRegex) {
            const endMatch = RegexUtils.safeExec(endRegex, afterStart);
            if (endMatch) {
                body = afterStart.slice(0, endMatch.index);
            }
        }

        const includeStartCapture = blockField.includeStartCapture !== false;
        const firstLine = includeStartCapture ? (startMatch[1] ?? '') : '';
        const combined = [firstLine, body].filter(Boolean).join('\n');

        return ValueNormalizer.clean(combined, blockField.transform);
    }
}
