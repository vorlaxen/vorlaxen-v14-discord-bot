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