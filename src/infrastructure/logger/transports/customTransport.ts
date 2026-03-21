import fs from 'fs';
import path from 'path';
import TransportStream, { TransportStreamOptions } from 'winston-transport';
import logger from '..';
import { CryptoUtil } from '@/shared/utils/encryption';

interface CustomTransportOptions extends TransportStreamOptions {
  logDir?: string;
  maxSizeMB?: number;
  maxFiles?: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  stack?: string;
}

class CustomLogTransport extends TransportStream {
  private baseLogDir: string;
  private maxSizeBytes: number;
  private maxFiles: number;

  constructor(opts: CustomTransportOptions) {
    super(opts);
    this.baseLogDir = opts.logDir || path.resolve(process.cwd(), 'logs');
    this.maxSizeBytes = (opts.maxSizeMB || 10) * 1024 * 1024;
    this.maxFiles = opts.maxFiles || 30;
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    try {
      if (['warn', 'error'].includes(info.level)) {
        const logId = CryptoUtil.generateUUID();
        const now = new Date();
        const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD

        const levelDir = path.join(this.baseLogDir, info.level);
        await this.ensureDirExists(levelDir);

        const logFile = path.join(levelDir, `${dateString}.log`);

        const logMessage: LogEntry = {
          id: logId,
          timestamp: now.toISOString(),
          level: info.level,
          message: info.message,
          stack: info.stack || undefined,
        };

        await this.writeLog(logFile, logMessage);
        await this.rotateIfNeeded(levelDir);
      }
    } catch (error: any) {
      logger.error(`CustomLogTransport error: ${error.message}`);
    } finally {
      callback();
    }
  }

  private async ensureDirExists(dir: string) {
    try {
      await fs.promises.access(dir, fs.constants.F_OK);
    } catch {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }

  private async writeLog(file: string, logMessage: LogEntry) {
    const line = JSON.stringify(logMessage) + '\n';
    await fs.promises.appendFile(file, line, 'utf8');
  }

  private async rotateIfNeeded(levelDir: string) {
    const files = (await fs.promises.readdir(levelDir))
      .filter(f => f.endsWith('.log'))
      .sort();

    if (files.length > this.maxFiles) {
      const toDelete = files.slice(0, files.length - this.maxFiles);
      await Promise.all(toDelete.map(f => fs.promises.unlink(path.join(levelDir, f))));
    }

    for (const file of files) {
      const filePath = path.join(levelDir, file);
      const stats = await fs.promises.stat(filePath);
      if (stats.size > this.maxSizeBytes) {
        const rotatedName = `${file.replace('.log', '')}-${Date.now()}.log`;
        await fs.promises.rename(filePath, path.join(levelDir, rotatedName));
      }
    }
  }
}

export default CustomLogTransport;
