
import logger from "../../infrastructure/logger";
import fs from "fs";
import { registerSignals } from "./signals";
import { initializeRedis } from "@/infrastructure/cache";
import { client } from "../bot";
import { botClientConfig } from "@/config";

export const bootstrap = async () => {
  try {
    logger.info("Starting application bootstrap...");

    const redis = await initializeRedis();

    client.start(botClientConfig.token);

    registerSignals({ redis });

  } catch (err) {
    logger.error("Failed to start application", err);
    process.exit(1);
  }
};
