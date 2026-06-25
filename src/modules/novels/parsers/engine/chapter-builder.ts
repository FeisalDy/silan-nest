import { Injectable } from '@nestjs/common';
import { ParsedChapter } from '../../interfaces/parsed-novel.interface';
import {
    ParsedNovelMetadata,
    ParserDefinition,
    PrefaceTitleSource,
} from './parser-definition';
import { NumberParser } from './number-parser';

@Injectable()
export class ChapterBuilder {
    buildChapter(
        match: RegExpExecArray,
        content: string,
        volumeNumber: number,
        definition: ParserDefinition
    ): ParsedChapter {
        const numberGroup = definition.chapter.heading.numberGroup;
        const titleGroup = definition.chapter.heading.titleGroup ?? 0;
        const subNumberGroup = definition.chapter.heading.subNumberGroup;

        const chapterNumber = NumberParser.chapter(
            match[numberGroup] ?? '',
            definition.chapter.numberParser
        );

        const chapterSubNumber = subNumberGroup
            ? NumberParser.chapterSub(
                  match[subNumberGroup] ?? '',
                  definition.chapter.subNumberParser
              )
            : 0;

        const title = titleGroup > 0 ? (match[titleGroup]?.trim() ?? '') : '';

        return {
            chapterNumber,
            chapterSubNumber,
            volumeNumber,
            title,
            content,
        };
    }

    buildPrefaceChapter(
        content: string,
        preface: NonNullable<ParserDefinition['chapter']['preface']>,
        metadata: ParsedNovelMetadata
    ): ParsedChapter {
        const title =
            this.resolvePrefaceTitle(preface.titleFrom, metadata) ?? '';

        return {
            chapterNumber: preface.chapterNumber ?? 1,
            chapterSubNumber: 0,
            volumeNumber: preface.volumeNumber ?? 0,
            title,
            content,
        };
    }

    private resolvePrefaceTitle(
        source: PrefaceTitleSource | undefined,
        metadata: ParsedNovelMetadata
    ): string | null {
        if (!source) return null;

        if (typeof source === 'string') {
            if (source === 'metadata.title') {
                return metadata.title;
            }

            return source;
        }

        if (typeof source === 'function') {
            return source(metadata);
        }

        return null;
    }
}
