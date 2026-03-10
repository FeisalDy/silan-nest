import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChapterDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  novelId: string;

  @ApiProperty()
  chapterNumber: number;

  @ApiProperty()
  chapterSubNumber: number;

  @ApiProperty()
  volumeNumber: number;

  @ApiProperty()
  languageCode: string;

  @ApiProperty()
  title: string | null;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  navigation?: {
    prev: { chapterNumber: number; chapterSubNumber: number } | null;
    next: { chapterNumber: number; chapterSubNumber: number } | null;
  };
  @ApiProperty()
  createdAt: Date;
}
