import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorDto } from './author.dto';

export class NovelDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  synopsis: string;

  @ApiProperty()
  coverUrl: string | null;

  @ApiProperty({ example: 'completed' })
  status: string;

  @ApiProperty()
  languageCode: string;

  @ApiPropertyOptional({ type: () => AuthorDto })
  author: AuthorDto | null;

  @ApiPropertyOptional({ type: [String] })
  aliases: string[];

  @ApiProperty()
  createdAt: Date;
}
