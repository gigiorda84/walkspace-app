import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFeedbackDto) {
    // Validate: must provide at least feedback or subscribe to newsletter
    if (!dto.subscribeToNewsletter && !dto.feedback?.trim()) {
      throw new BadRequestException(
        'Please provide feedback or subscribe to the newsletter',
      );
    }

    // Validate: email required if subscribing
    if (dto.subscribeToNewsletter && !dto.email?.trim()) {
      throw new BadRequestException(
        'Email is required to subscribe to the newsletter',
      );
    }

    return this.prisma.feedbackSubmission.create({
      data: {
        email: dto.email?.trim() || null,
        name: dto.name?.trim() || null,
        feedback: dto.feedback?.trim() || null,
        subscribeToNewsletter: dto.subscribeToNewsletter,
      },
    });
  }

  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      this.prisma.feedbackSubmission.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedbackSubmission.count(),
    ]);

    return {
      data: submissions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
