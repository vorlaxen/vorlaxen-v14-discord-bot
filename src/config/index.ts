import { EnvUtils } from "@/shared/utils/common/env.util";
import { loadEnv } from "@/shared/utils/common/loader.util";

loadEnv();

const env = process.env;
const isProd = env.NODE_ENV === 'production';

export const RuntimeConfig = {
    environment: EnvUtils.mustParse(env.NODE_ENV, 'NODE_ENV', String),
    isProd: isProd
};

export * from "./cache.config"
export * from "./bot.config"
