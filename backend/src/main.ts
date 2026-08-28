import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./shared/common/errors/global-exception.filter";

const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));
  app.setGlobalPrefix("api");
  app.use(cookieParser());
  const helmetOpts: Record<string, unknown> = {
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  };
  if (process.env.HELMET_REPORT_ONLY === "true") {
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
  app.enableCors({
    origin: CORS_ORIGINS,
    credentials: true,
  });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`9AWI API ready on http://localhost:${port}/api`);
}
void bootstrap();