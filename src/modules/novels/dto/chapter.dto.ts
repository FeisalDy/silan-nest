import { ApiProperty } from '@nestjs/swagger';

export class ChapterDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  novelId: string;

  @ApiProperty()
  chapterNumber: number;

  @ApiProperty()
  volumeNumber: number;

  @ApiProperty()
  languageCode: string;

  @ApiProperty()
  title: string | null;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;
}
