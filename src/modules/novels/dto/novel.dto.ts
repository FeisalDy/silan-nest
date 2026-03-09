import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorDto } from './author.dto.js';

export class NovelDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  synopsis?: string;

  @ApiProperty()
  coverUrl: string;

  @ApiProperty({ example: 'completed' })
  status: string;

  @ApiProperty()
  languageCode: string;

  @ApiProperty({ type: () => AuthorDto })
  author: AuthorDto;

  @ApiPropertyOptional({ type: [String] })
  aliases?: string[];

  @ApiProperty()
  createdAt: Date;
}
