import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { JobEntity, JobStatus, JobType } from '@/common/constants/job.constant';

export class JobDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    @Expose()
    id: string;

    @ApiProperty({ enum: JobType })
    @Expose()
    type: JobType;

    @ApiProperty({ enum: JobStatus })
    @Expose()
    status: JobStatus;

    @ApiProperty({ enum: JobEntity })
    @Expose()
    entityType: JobEntity;

    @ApiProperty({ example: '456e7890-e89b-12d3-a456-426614174000' })
    @Expose()
    entityId: string;

    @ApiPropertyOptional({ example: 'en' })
    @Expose()
    sourceLanguage?: string;

    @ApiPropertyOptional({ example: 'es' })
    @Expose()
    targetLanguage?: string;

    @ApiPropertyOptional()
    @Expose()
    payload?: Record<string, any>;

    @ApiPropertyOptional()
    @Expose()
    result?: Record<string, any>;

    @ApiPropertyOptional()
    @Expose()
    errorMessage?: string | null;

    @ApiProperty({ example: 0 })
    @Expose()
    attempts: number;

    @ApiPropertyOptional()
    @Expose()
    startedAt?: Date | null;

    @ApiPropertyOptional()
    @Expose()
    completedAt?: Date | null;

    @ApiPropertyOptional()
    @Expose()
    failedAt?: Date | null;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;
}
