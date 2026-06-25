import { IsArray, IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { JobType, JobEntity } from '@/common/constants/job.constant';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RetryFilterDto {
    @ApiPropertyOptional({ description: 'Explicit job ids to retry, bypasses other filters if provided' })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    ids?: string[]; // explicit job ids, bypasses other filters if provided

    @ApiPropertyOptional({ enum: JobType, description: 'Filter by job type' })
    @IsOptional()
    @IsArray()
    @IsEnum(JobType, { each: true })
    types?: JobType[];

    @ApiPropertyOptional({ enum: JobEntity, description: 'Filter by job entity type' })
    @IsOptional()
    @IsArray()
    @IsEnum(JobEntity, { each: true })
    entityTypes?: JobEntity[];

    @ApiPropertyOptional({ description: 'Filter after failed date' })
    @IsOptional()
    @IsDateString()
    failedAfter?: string; // ISO date

    @ApiPropertyOptional({ description: 'Filter before failed date' })
    @IsOptional()
    @IsDateString()
    failedBefore?: string;

    @ApiPropertyOptional({ description: 'Filter by bulk job ID' })
    @IsOptional()
    @IsUUID()
    bulkJobId?: string;

    @ApiPropertyOptional({ description: 'Limit the number of jobs to return' })
    @IsOptional()
    limit?: number; // safety cap, default applied server-side if omitted
}