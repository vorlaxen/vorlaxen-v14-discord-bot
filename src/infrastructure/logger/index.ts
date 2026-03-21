import { createLogger, format, transports, Logger } from 'winston';
import CustomLogTransport from './transports/customTransport';
import { consoleFormat } from './logger.util';
import { RuntimeConfig } from '@/config';

export const loggerLevel = RuntimeConfig.isProd ? 'info' : 'debug';

const logger: Logger = createLogger({
  level: loggerLevel,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      level: RuntimeConfig.isProd ? 'info' : 'debug',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
        //consoleFormat
      ),
    }),

    new CustomLogTransport({
      logDir: 'logs',
      maxSizeMB: 10,
      maxFiles: 30,
    })
  ],
  exitOnError: false,
  handleExceptions: true,
  handleRejections: true,
});

export default logger;
