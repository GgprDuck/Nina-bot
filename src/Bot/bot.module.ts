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
import { HelpCommand } from './commands/help.command';
import { ChatSettingsModule } from 'src/chat-settings/chat-settings.module';
import { RemindersModule } from 'src/reminders/reminders.module';
import { ReminderScheduler } from './reminders/reminder.scheduler';
import { QuickInputHandler } from './handlers/quick-input.handler';
import { SharedSpaceModule } from 'src/shared-space/shared-space.module';

@Module({
  imports: [
    DiscoveryModule,
    ShoppingListModule,
    RecipiesModule,
    SpendingsModule,
    ChatSettingsModule,
    RemindersModule,
    SharedSpaceModule,
  ],
  providers: [
    BotService,
    BotUpdate,
    CommandRegistry,
    MessageRegistry,
    StartCommand,
    HelpCommand,
    FlowService,
    PingHandler,
    QuickInputHandler,
    MenuHandler,
    FlowHandler,
    CallbackHandler,
    ReminderScheduler,
  ],
  exports: [
    BotService,
    BotUpdate,
    CommandRegistry,
    MessageRegistry,
    StartCommand,
    HelpCommand,
    PingHandler,
    QuickInputHandler,
    FlowService,
  ],
})
export class BotModule {}