import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportNovelDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Novel .txt file',
  })
  file: any; // Multer file handled by interceptor

  @ApiPropertyOptional({
    type: 'string',
    description:
      'Optional format identifier (e.g. sfacg-meta-chapter-v1). If omitted, the parser will be auto-detected.',
  })
  formatId?: string;
}
