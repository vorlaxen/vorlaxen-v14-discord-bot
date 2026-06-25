import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { DatabaseConfig } from '@/config';
import { logger } from '../logger';

const connectionOptions: DataSourceOptions = {
  type: 'postgres',
  host: DatabaseConfig.host,
  port: DatabaseConfig.port,
  username: DatabaseConfig.username,
  password: DatabaseConfig.password,
  database: DatabaseConfig.database,
  extra: {
    max: DatabaseConfig.poolMax,
    min: DatabaseConfig.poolMin,
    acquireTimeoutMillis: DatabaseConfig.acquire,
    idleTimeoutMillis: DatabaseConfig.idle,
  },
  ssl: false,
  synchronize: true,
  logging: DatabaseConfig.logging,
  entities: DatabaseConfig.entities,
  migrations: ['src/infra/database/migrations/*.ts'],
  subscribers: ['src/infra/database/subscribers/*.ts'],
};

export const AppDataSource = new DataSource(connectionOptions);

export class DatabaseService {
  private constructor() {}

  public static async initialize(): Promise<DataSource> {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        logger.info('Database: connection established successfully.');
      }
    } catch (error) {
      logger.error({ err: error }, 'Database: Error during initialization:');
      throw error;
    }

    return AppDataSource;
  }

  public static getInstance(): DataSource {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database: must be initialized before use.');
    }
    return AppDataSource;
  }

  public static async close(): Promise<void> {
    if (!AppDataSource.isInitialized) return;

    try {
      await AppDataSource.destroy();
      logger.info('Database: connection closed gracefully.');
    } catch (error) {
      logger.error({ err: error }, 'Database: Error during connection closure:');
      throw error;
    }
  }
}
