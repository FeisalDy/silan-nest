// import { JobStatus } from '@/common/constants/job.constant';
//
// export class UpdateJobStatusDto {
//   status: JobStatus;
//
//   errorMessage?: string;
//
//   errorStack?: string;
//
//   attempts?: number;
// }

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { JobStatus } from '@/common/constants/job.constant';

export class UpdateJobStatusDto {
  @ApiProperty({
    enum: JobStatus,
    description: 'Job status',
  })
  @IsEnum(JobStatus)
  status: JobStatus;

  @ApiPropertyOptional({
    description: 'Error message when the job fails',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'Error stack trace for debugging',
  })
  @IsOptional()
  @IsString()
  errorStack?: string;

  @ApiPropertyOptional({
    description: 'Number of retry attempts',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  attempts?: number;
}
