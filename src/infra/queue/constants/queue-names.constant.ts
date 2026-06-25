export const QueueNames = {
  BACKGROUND: 'background',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];
