import { Injectable } from '@nestjs/common';
import { ParsedChapter } from '../../interfaces/parsed-novel.interface';
import { ParsedNovelMetadata, ParserDefinition } from './parser-definition';
import { ChapterBuilder } from './chapter-builder';
import { RegexUtils } from './regex-utils';

@Injectable()
export class ChapterExtractor {
  constructor(private readonly chapterBuilder: ChapterBuilder) {}

  extract(
    text: string,
    definition: ParserDefinition,
    metadata: ParsedNovelMetadata,
    chapterLimit?: number
  ): ParsedChapter[] {
    const chapters: ParsedChapter[] = [];
    const headingRe = RegexUtils.toGlobal(definition.chapter.heading.regex);

    let match = headingRe.exec(text);
    const firstHeadingIndex = match ? match.index : -1;

    if (definition.chapter.preface?.enabled) {
      const prefaceContent = this.extractPrefaceContent(text, firstHeadingIndex);
      if (prefaceContent) {
        chapters.push(
          this.chapterBuilder.buildPrefaceChapter(
            prefaceContent,
            definition.chapter.preface,
            metadata
          )
        );

        if (chapterLimit && chapters.length >= chapterLimit) {
          return chapters;
        }
      }
    }

    if (!match) {
      return chapters;
    }

    let lastIndex = 0;
    let lastMatch: RegExpExecArray | null = null;
    let currentVolume = definition.chapter.volume.startAt;
    let previousChapterNumber = 0;

    do {
      if (lastMatch) {
        const content = text.slice(lastIndex, match.index).trim();
        chapters.push(
          this.chapterBuilder.buildChapter(
            lastMatch,
            content,
            currentVolume,
            definition
          )
        );

        if (chapterLimit && chapters.length >= chapterLimit) {
          return chapters;
        }
      }

      const chapterNumber = definition.chapter.numberParser(match[
        definition.chapter.heading.numberGroup
      ] ?? '');

      if (
        lastMatch !== null &&
        definition.chapter.volume.incrementOnReset &&
        chapterNumber <= previousChapterNumber
      ) {
        currentVolume++;
      }

      previousChapterNumber = chapterNumber;
      lastMatch = match;
      lastIndex = headingRe.lastIndex;
    } while ((match = headingRe.exec(text)) !== null);

    if (lastMatch && (!chapterLimit || chapters.length < chapterLimit)) {
      const content = text.slice(lastIndex).trim();
      chapters.push(
        this.chapterBuilder.buildChapter(
          lastMatch,
          content,
          currentVolume,
          definition
        )
      );
    }

    return chapters;
  }

  private extractPrefaceContent(text: string, firstHeadingIndex: number): string {
    if (firstHeadingIndex <= 0) {
      return text.trim();
    }

    return text.slice(0, firstHeadingIndex).trim();
  }
}

