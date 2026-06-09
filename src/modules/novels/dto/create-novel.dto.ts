import { ApiProperty, PickType } from '@nestjs/swagger';
import { NovelDto } from './novel.dto';

export class CreateNovelDto extends PickType(NovelDto, [
  'title',
  'slug',
  'synopsis',
  'coverUrl',
  'status',
  'languageCode',
  'aliases',
] as const) {
  @ApiProperty({
    description: 'The UUID or ID of an existing author',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  authorId: string | null;
}
