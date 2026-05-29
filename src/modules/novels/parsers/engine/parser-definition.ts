export interface ParsedNovelMetadata {
  title: string | null;
  author: string | null;
  synopsis: string | null;
  status: string | null;
}

export type PrefaceTitleSource =
  | 'metadata.title'
  | string
  | ((metadata: ParsedNovelMetadata) => string | null);

export type MetadataValueTransform = (value: string) => string | null;
export type MetadataExtractor = (text: string) => string | null;

export interface MetadataRegexField {
  type: 'regex';
  regex: RegExp;
  group?: number;
  transform?: MetadataValueTransform;
}

export interface MetadataExtractorField {
  type: 'extractor';
  extractor: MetadataExtractor;
  transform?: MetadataValueTransform;
}

export interface MetadataBlockField {
  type: 'block';
  start: RegExp;
  end?: RegExp;
  includeStartCapture?: boolean;
  transform?: MetadataValueTransform;
}

export type MetadataFieldDefinition =
  | MetadataRegexField
  | MetadataExtractorField
  | MetadataBlockField;

export interface MetadataDefinition {
  title?: MetadataFieldDefinition;
  author?: MetadataFieldDefinition;
  status?: MetadataFieldDefinition;
  synopsis?: MetadataFieldDefinition;
}

export interface ChapterHeadingDefinition {
  regex: RegExp;
  numberGroup: number;
  titleGroup?: number;
  subNumberGroup?: number;
}

export interface ChapterDefinition {
  heading: ChapterHeadingDefinition;
  numberParser: (raw: string) => number;
  subNumberParser?: (raw: string) => number;
  volume: {
    startAt: number;
    incrementOnReset: boolean;
  };
  preface?: {
    enabled: boolean;
    titleFrom?: PrefaceTitleSource;
    chapterNumber?: number;
    volumeNumber?: number;
  };
}

export interface ParserDefinition {
  formatId: string;
  formatAliases?: string[];
  languageCode: string;
  matchScore: (text: string) => number;
  metadata?: MetadataDefinition;
  chapter: ChapterDefinition;
}
