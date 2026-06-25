import pino, { Logger } from 'pino';
import path from 'path';
import fs from 'fs';
import { AppConfig } from '@/config';

export class LoggerService {
  private static instance: Logger;

  public static getInstance(): Logger {
    if (!LoggerService.instance) {
      const isDev = !AppConfig.isProd;

      if (isDev) {
        const logDir = path.resolve(process.cwd(), 'logs');

        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }

        const transport = pino.transport({
          targets: [
            { target: 'pino/file', options: { destination: 1 } },
            {
              target: 'pino/file',
              options: { destination: path.join(logDir, 'combined.log') },
            },
          ],
        });

        LoggerService.instance = pino({ level: 'debug' }, transport);

        transport.on('error', (err) => {
          console.error('CRITICAL: Pino Transport Failure:', err);
        });
      } else {
        LoggerService.instance = pino({
          level: 'info',
        });
      }
    }

    return LoggerService.instance;
  }
}

export const logger = LoggerService.getInstance();
