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
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/common/constants/role.constant';
import {
  BulkImportNovelDto,
  ImportNovelDto,
} from '@/modules/jobs/dto/Import-novel.dto';
import * as path from 'path';
import { JobsService } from '@/modules/jobs/jobs.service';
import { UpdateJobStatusDto } from '@/modules/jobs/dto/update-status.dto';
import { Lang } from '@/common/constants/lang.constant';
import { InternalTokenGuard } from '@/modules/auth/guards/internal-token.guard';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { ZipValidatorUtil } from '@/common/utils/validate-zip.util';
import { NovelParserService } from '@/modules/jobs/services/novel-parser.service';

@Roles(Role.EDITOR)
@ApiTags('Jobs')
@ApiBearerAuth('access-token')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly novelParserService: NovelParserService
  ) {}
  @Post('import-novel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ImportNovelDto })
  importNovel(
    @UploadedFile() file: Express.Multer.File,
    @Body('formatId') formatId?: string
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== '.txt' || file.mimetype !== 'text/plain') {
      throw new BadRequestException('Only plain text (.txt) files are allowed');
    }

    return this.jobsService.enqueueNovelImport(file, formatId);
  }

  @Post('import-novel/preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: ImportNovelDto,
  })
  previewImportedNovel(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportNovelDto
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== '.txt' || file.mimetype !== 'text/plain') {
      throw new BadRequestException('Only plain text (.txt) files are allowed');
    }

    return this.novelParserService.previewNovelImport(
      file,
      dto.formatId,
      dto.chapterLimit
    );
  }

  @Post('import-novel/bulk')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: BulkImportNovelDto,
  })
  async bulkImportNovel(
    @UploadedFile()
    file: Express.Multer.File
  ) {
    await ZipValidatorUtil.validate(file, {
      maxFiles: 1000,
      maxUncompressedSize: 500 * 1024 * 1024,
      allowedExtensions: ['.txt'],
    });

    return this.jobsService.enqueueBulkNovelImport(file);
  }
  @Post('index-novel/:novelId')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['lang'],
      properties: {
        lang: {
          type: 'string',
          description: 'Which language you want to index (e.g, en, id)',
        },
      },
    },
  })
  indexNovel(@Param('novelId') novelId: string, @Body() body: { lang: Lang }) {
    return this.jobsService.enqueueNovelIndex(novelId, body.lang);
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
  @ApiBody({
    type: UpdateJobStatusDto,
  })
  @Public()
  @UseGuards(InternalTokenGuard)
  async updateStatus(
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobStatusDto
  ) {
    return this.jobsService.updateStatus(jobId, dto);
  }
}
