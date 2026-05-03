import "dotenv/config";

import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(
      `[backend] Falta la variable ${name}. Edita backend/.env (copia desde backend/.env.example).`,
    );
    process.exit(1);
  }
  return v;
}

async function bootstrap() {
  requireEnv("SUPABASE_URL");
  requireEnv("SUPABASE_ANON_KEY");

  const app = await NestFactory.create(AppModule);

  const origin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
  app.enableCors({
    origin: [origin, /^http:\/\/localhost:\d+$/],
    credentials: true,
  });

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

bootstrap();
