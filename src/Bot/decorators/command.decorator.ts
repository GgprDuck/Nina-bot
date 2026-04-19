export const COMMAND_METADATA = 'COMMAND_METADATA';

export function Command(command: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(COMMAND_METADATA, command, target);
  };
}
