import { EnvUtils } from "@/shared/utils/common";

const env = process.env;
export interface IBotClientConfigConfig {
  token: string;
  clientId: string;
  testGuildId: string;
  prefix: string;
  ownerIds: string[];
}

export const botClientConfig: IBotClientConfigConfig = {
  token: EnvUtils.mustParse(env.BOT_TOKEN, 'BOT_TOKEN', String),
  clientId: EnvUtils.mustParse(env.BOT_CLIENT_ID, 'BOT_CLIENT_ID', String),
  testGuildId: EnvUtils.mustParse(env.BOT_TEST_GUILD_ID, 'BOT_TEST_GUILD_ID', String),
  prefix: EnvUtils.mustParse(env.BOT_PREFIX, 'BOT_PREFIX', String),
  ownerIds: ["1391178471442747424"]
}

export enum BotComponentColor {
  PRIMARY = '#5865F2',
  SUCCESS = '#57F287',
  DANGER = '#ED4245',
  SECONDARY = '#d90be0',
  WARNING = '#FEE75C',
  INFO = '#3498DB',
  PROCESS = '#2B2D31'
}