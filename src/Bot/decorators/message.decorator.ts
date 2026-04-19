export const MESSAGE_METADATA = 'MESSAGE_METADATA';

export function OnMessage(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(MESSAGE_METADATA, true, target);
  };
}
