import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/common/errors/global-exception.filter';

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'https://coach-yossri.vercel.app',
  'http://localhost:3001',
];
const ENV_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const CORS_ORIGINS = [...new Set([...DEFAULT_ORIGINS, ...ENV_ORIGINS])];

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  const helmetOpts: Record<string, unknown> = {
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  };
  if (process.env.HELMET_REPORT_ONLY === 'true') {
    helmetOpts.contentSecurityPolicy = false;
  }
  app.use(helmet(helmetOpts));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  console.log('[CORS] allowed origins:', CORS_ORIGINS.join(', '));
  app.enableCors({
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
  });
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Coach Yosri API ready on http://localhost:${port}/api`);
}
void bootstrap();
