import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ImportNovelDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Novel .txt file',
  })
  file: any;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Optional format identifier. If omitted, auto-detected.',
  })
  @IsOptional() // Backend validation
  formatId?: string;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Optional chapters displayed, max 20',
    minimum: 1,
    maximum: 20,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  chapterLimit?: number = 10;
}
