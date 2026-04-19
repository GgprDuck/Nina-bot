import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { COMMAND_METADATA } from '../decorators/command.decorator';
import { BotCommand } from '../interfaces/command.interface';

@Injectable()
export class CommandRegistry implements OnModuleInit {
  private commands = new Map<string, BotCommand>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    const providers = this.discovery.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper as { instance: BotCommand };

      if (!instance) continue;

      const command = this.reflector.get<string>(
        COMMAND_METADATA,
        instance.constructor,
      );

      if (!command) continue;

      this.commands.set(command, instance);
    }
  }

  get(command: string): BotCommand | undefined {
    return this.commands.get(command);
  }
}
