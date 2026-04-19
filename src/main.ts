import { NestFactory } from '@nestjs/core';
import { AppModule } from './App/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Bot is running on port ${process.env.PORT ?? 3000}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
