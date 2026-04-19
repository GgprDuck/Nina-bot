import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { MESSAGE_METADATA } from '../decorators/message.decorator';
import { MessageHandler } from '../interfaces/message-handler.interface';

@Injectable()
export class MessageRegistry implements OnModuleInit {
  private handlers: MessageHandler[] = [];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    const providers = this.discovery.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper as { instance: MessageHandler };
      if (!instance) continue;

      const isHandler = this.reflector.get<boolean>(
        MESSAGE_METADATA,
        instance.constructor,
      );

      if (!isHandler) continue;

      this.handlers.push(instance);
    }
  }

  getHandlers(): MessageHandler[] {
    return this.handlers;
  }
}
