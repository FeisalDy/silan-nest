import { ApiProperty } from '@nestjs/swagger';

export class ImportNovelDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Novel .txt file',
  })
  file: any; // Multer file handled by interceptor

  @ApiProperty({
    type: 'string',
    description: 'Source identifier (e.g. source-a, source-b)',
  })
  source: string;
}
