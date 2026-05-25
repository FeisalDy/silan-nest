import { JobStatus } from '@/common/constants/job.constant';

export class UpdateJobStatusDto {
  status: JobStatus;

  errorMessage?: string;

  errorStack?: string;

  attempts?: number;
}
