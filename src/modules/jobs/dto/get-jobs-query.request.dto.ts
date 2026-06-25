import { PageOptionsDto } from '@/common/dto/page-options.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, JobType } from '@/common/constants/job.constant';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetJobsQueryRequestDto extends PageOptionsDto {
    @ApiPropertyOptional({ enum: JobStatus })
    @IsEnum(JobStatus)
    @IsOptional()
    readonly status: JobStatus;

    @ApiPropertyOptional({ enum: JobType })
    @IsOptional()
    @IsEnum(JobType)
    readonly type: JobType;

    @ApiPropertyOptional({ description: 'Filter by entityId' })
    @IsOptional()
    @IsString()
    entityId?: string;
}
