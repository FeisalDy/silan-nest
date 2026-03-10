import { ApiProperty } from '@nestjs/swagger';

export class AuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  photoUrl: string | null;

  @ApiProperty()
  biography: string | null;
}
