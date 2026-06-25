import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsArray,
    IsInt,
    Min,
    ValidateIf,
    IsEnum,
} from 'class-validator';
import { AuthorDto } from './author.dto';
import { Lang } from '@/common/constants/lang.constant';

export class NovelDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiProperty({ nullable: true })
    @ValidateIf((o, v) => v !== null)
    @IsString()
    synopsis: string | null;

    @ApiProperty({ nullable: true })
    @ValidateIf((o, v) => v !== null)
    @IsString()
    coverUrl: string | null;

    @ApiProperty({ example: 'completed', nullable: true })
    @ValidateIf((o, v) => v !== null)
    @IsString()
    status: string | null;

    @ApiProperty()
    @IsEnum(Lang)
    @IsNotEmpty()
    languageCode: Lang;

    @ApiPropertyOptional({ type: () => AuthorDto, nullable: true })
    author: AuthorDto | null;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    aliases: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    chapterCount?: number;

    @ApiProperty()
    createdAt: Date;
}
