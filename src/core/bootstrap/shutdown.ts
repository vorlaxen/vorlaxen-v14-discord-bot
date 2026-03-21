import { ShutdownDeps } from "@/shared/types/bootstrap.type";
import logger from "../../infrastructure/logger";

export const shutdown = async (
  signal: string,
  deps: ShutdownDeps
) => {
  try {
    logger.info(`Received ${signal}. Shutting down...`);

    process.exit(0);
  } catch (err) {
    logger.error("Shutdown error", err);
    process.exit(1);
  }
};
