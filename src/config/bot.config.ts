import { EnvUtils } from '@/shared/utils/common/env.util';

export interface IBotClientConfigConfig {
  token: string;
  clientId: string;
  GuildId: string;
  prefix: string;
  ownerIds: string[];
}

export const botClientConfig: IBotClientConfigConfig = {
  token: EnvUtils.string('BOT_TOKEN'),
  clientId: EnvUtils.string('BOT_CLIENT_ID'),
  GuildId: EnvUtils.string('BOT_GUILD_ID'),
  prefix: EnvUtils.string('BOT_PREFIX'),
  ownerIds: ['1391178471442747424'],
};

export enum BotComponentColor {
  PRIMARY = '#5865F2',
  SUCCESS = '#57F287',
  DANGER = '#ED4245',
  SECONDARY = '#d90be0',
  WARNING = '#FEE75C',
  INFO = '#3498DB',
  PROCESS = '#2B2D31',
}
