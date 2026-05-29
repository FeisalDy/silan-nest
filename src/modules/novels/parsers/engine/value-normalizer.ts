import { MetadataValueTransform } from './parser-definition';

export class ValueNormalizer {
  static clean(value: string, transform?: MetadataValueTransform): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (transform) {
      const transformed = transform(trimmed);
      return transformed ? transformed.trim() : null;
    }

    return trimmed;
  }
}

