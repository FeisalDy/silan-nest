import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/common/constants/role.constant';
import { ImportNovelDto } from '@/modules/jobs/dto/Import-novel.dto';
import * as path from 'path';
import { NovelImportService } from '@/modules/jobs/services/novel-import.service';
import { JobsService } from '@/modules/jobs/jobs.service';
import { UpdateJobStatusDto } from '@/modules/jobs/dto/update-status.dto';
import { Lang } from '@/common/constants/lang.constant';
import { InternalToken } from '@/modules/auth/decorators/internal-token.decorator';
import { InternalTokenGuard } from '@/modules/auth/guards/internal-token.guard';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}
  @Post('import-novel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ImportNovelDto })
  importNovel(
    @UploadedFile() file: Express.Multer.File,
    @Body('source') source: string
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== '.txt' || file.mimetype !== 'text/plain') {
      throw new BadRequestException('Only plain text (.txt) files are allowed');
    }

    return this.jobsService.enqueueNovelImport(file, source);
  }

  @Post('import-novel/preview')
  @Roles(Role.EDITOR)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: ImportNovelDto,
  })
  previewImportedNovel(
    @UploadedFile() file: Express.Multer.File,
    @Body('source') source: string
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== '.txt' || file.mimetype !== 'text/plain') {
      throw new BadRequestException('Only plain text (.txt) files are allowed');
    }

    return this.jobsService.previewNovelImport(file, source, 10);
  }

  @Post('process-novel/:novelId')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['targetLang'],
      properties: {
        targetLang: {
          type: 'string',
          description: 'Target language code (e.g. en, id, ja)',
        },
      },
    },
  })
  processNovel(
    @Param('novelId') novelId: string,
    @Body() body: { targetLang: Lang }
  ) {
    return this.jobsService.enqueueNovelProcessing(novelId, body.targetLang);
  }

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string) {
    const job = await this.jobsService.getJob(jobId);
    if (!job) {
      throw new BadRequestException('Job not found');
    }
    return job;
  }

  @Patch(':jobId/status')
  @UseGuards(InternalTokenGuard)
  async updateStatus(
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobStatusDto
  ) {
    return this.jobsService.updateStatus(jobId, dto);
  }
}
