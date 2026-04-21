import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { CommandRegistry } from './registry/command.registry';
import { MessageRegistry } from './registry/message.registry';
import { StartCommand } from './commands/start.command';
import { FlowService } from './flow/flow.service';
import { PingHandler } from './handlers/ping.handler';
import { MenuHandler } from './handlers/menu.handler';
import { FlowHandler } from './handlers/flow.handler';
import { ShoppingListModule } from 'src/shopping-list/shopping-list.module';
import { RecipiesModule } from 'src/recipies/recipies.module';
import { SpendingsModule } from 'src/spendings/spendings.module';
import { CallbackHandler } from './handlers/callback.handler';

@Module({
  imports: [
    DiscoveryModule,
    ShoppingListModule,
    RecipiesModule,
    SpendingsModule,
  ],
  providers: [
    BotService,
    BotUpdate,
    CommandRegistry,
    MessageRegistry,
    StartCommand,
    FlowService,
    PingHandler,
    MenuHandler,
    FlowHandler,
    CallbackHandler,
  ],
  exports: [
    BotService,
    BotUpdate,
    CommandRegistry,
    MessageRegistry,
    StartCommand,
    PingHandler,
    FlowService,
  ],
})
export class BotModule {}