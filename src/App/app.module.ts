import { Module } from '@nestjs/common';
import { AppController } from '../App/app.controller';
import { AppService } from '../App/app.service';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from '../Bot/bot.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    BotModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
