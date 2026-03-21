import logger from "@/infrastructure/logger";
import { shutdown } from "./shutdown";
import { ShutdownDeps } from "@/shared/types/bootstrap.type";

export const registerSignals = (deps: ShutdownDeps) => {
  process.on("SIGINT", () => shutdown("SIGINT", deps));
  process.on("SIGTERM", () => shutdown("SIGTERM", deps));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection", reason);
    //shutdown("unhandledRejection", deps);
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception", err);
    //shutdown("uncaughtException", deps)
  });
};
