import { logger } from '@/infra/logger';
import { Client, ActivityType, PresenceStatusData, PresenceData } from "discord.js";

interface PresenceActivity {
  name: string;
  type: ActivityType;
  durationMs?: number;
  url?: string;
  details?: string;
  state?: string;
}

interface PresenceOptions {
  status?: PresenceStatusData;
  activities?: PresenceActivity[];
  afk?: boolean;
  shardId?: number | number[];
}

interface PresenceConfig {
  enableLogging?: boolean;
  defaultDuration?: number;
  enableErrorRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

class PresenceHelper {
  private client: Client;
  private rotationInterval?: NodeJS.Timeout;
  private currentActivityIndex: number = 0;
  private isRotating: boolean = false;
  private config: Required<PresenceConfig>;
  private retryCount: number = 0;
  private currentActivities: PresenceActivity[] = [];
  private currentStatus: PresenceStatusData = "online";

  constructor(client: Client, config: PresenceConfig = {}) {
    this.client = client;
    this.config = {
      enableLogging: config.enableLogging ?? true,
      defaultDuration: config.defaultDuration ?? 60000,
      enableErrorRetry: config.enableErrorRetry ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 5000,
    };
  }

  async setPresence(options: PresenceOptions): Promise<boolean> {
    try {
      if (!this.client.user) {
        logger.warn("Cannot set presence: client.user is undefined");
        return false;
      }

      const { status = "online", activities = [], afk = false, shardId } = options;
      this.currentStatus = status;

      if (activities.length === 0) {
        return await this.setSinglePresence({
          status,
          activities: [{ name: "Başlatılıyor...", type: ActivityType.Playing }],
          afk,
          shardId,
        });
      }

      if (activities.length === 1) {
        // Single activity
        return await this.setSinglePresence({
          status,
          activities: this.formatActivities([activities[0]]),
          afk,
          shardId,
        });
      }

      // Multiple activities - start rotation
      this.currentActivities = activities;
      return this.startRotation(status, activities, afk, shardId);
    } catch (error) {
      this.handleError("Failed to set bot presence", error);
      return false;
    }
  }

  /**
   * Set a single presence without rotation
   */
  async setSinglePresence(presenceData: PresenceData): Promise<boolean> {
    try {
      if (!this.client.user) {
        logger.warn("Cannot set single presence: client.user is undefined");
        return false;
      }

      await this.client.user.setPresence(presenceData);
      
      if (this.config.enableLogging) {
        this.logPresence("Single presence set");
      }
      
      this.retryCount = 0;
      return true;
    } catch (error) {
      this.handleError("Failed to set single presence", error);
      
      if (this.config.enableErrorRetry && this.retryCount < this.config.maxRetries) {
        return await this.retrySetPresence(() => this.setSinglePresence(presenceData));
      }
      
      return false;
    }
  }

  /**
   * Start activity rotation
   */
  private startRotation(
    status: PresenceStatusData,
    activities: PresenceActivity[],
    afk: boolean = false,
    shardId?: number | number[]
  ): boolean {
    if (this.isRotating) {
      logger.warn("Rotation is already running");
      return false;
    }

    this.isRotating = true;
    this.currentActivityIndex = 0;

    const rotate = async () => {
      if (!this.client.user || !this.isRotating) return;

      try {
        const currentActivity = activities[this.currentActivityIndex];
        const formattedActivities = this.formatActivities([currentActivity]);

        await this.client.user.setPresence({
          status,
          activities: formattedActivities,
          afk,
          shardId,
        });

        if (this.config.enableLogging) {
          //this.logPresence(`Rotated to activity: ${currentActivity.name}`);
        }

        this.currentActivityIndex = (this.currentActivityIndex + 1) % activities.length;
        const duration = currentActivity.durationMs ?? this.config.defaultDuration;
        
        this.rotationInterval = setTimeout(rotate, duration);
        this.retryCount = 0;
      } catch (error) {
        this.handleError("Failed to rotate presence", error);
        
        if (this.config.enableErrorRetry && this.retryCount < this.config.maxRetries) {
          setTimeout(rotate, this.config.retryDelay);
          this.retryCount++;
        } else {
          this.stopRotation();
        }
      }
    };

    rotate();
    return true;
  }

  /**
   * Stop activity rotation
   */
  stopRotation(): void {
    if (this.rotationInterval) {
      clearTimeout(this.rotationInterval);
      this.rotationInterval = undefined;
    }
    
    this.isRotating = false;
    this.retryCount = 0;

    if (this.config.enableLogging) {
      logger.info({
        message: "Presence rotation stopped",
        timestamp: new Date().toISOString(),
        event: "presenceRotationStopped",
      });
    }
  }

  /**
   * Pause rotation temporarily
   */
  pauseRotation(): void {
    if (this.rotationInterval) {
      clearTimeout(this.rotationInterval);
      this.rotationInterval = undefined;
    }
    
    if (this.config.enableLogging) {
      logger.info({
        message: "Presence rotation paused",
        timestamp: new Date().toISOString(),
        event: "presenceRotationPaused",
      });
    }
  }

  /**
   * Resume paused rotation
   */
  resumeRotation(): boolean {
    if (!this.isRotating || this.currentActivities.length === 0) {
      logger.warn("Cannot resume rotation: not initialized or no activities");
      return false;
    }

    return this.startRotation(this.currentStatus, this.currentActivities);
  }

  /**
   * Get current presence status
   */
  getCurrentPresence(): {
    status: PresenceStatusData;
    isRotating: boolean;
    currentActivity?: PresenceActivity;
    totalActivities: number;
  } {
    const currentActivity = this.isRotating && this.currentActivities.length > 0
      ? this.currentActivities[this.currentActivityIndex]
      : undefined;

    return {
      status: this.currentStatus,
      isRotating: this.isRotating,
      currentActivity,
      totalActivities: this.currentActivities.length,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PresenceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enableLogging) {
      logger.info({
        message: "Presence helper configuration updated",
        config: newConfig,
        timestamp: new Date().toISOString(),
        event: "configUpdated",
      });
    }
  }

  private formatActivities(activities: PresenceActivity[]) {
    return activities.map(activity => ({
      name: activity.name,
      type: activity.type,
      url: activity.url,
    }));
  }

  private handleError(message: string, error: unknown): void {
    logger.error({
      message,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      timestamp: new Date().toISOString(),
      event: "presenceError",
      retryCount: this.retryCount,
    });
  }

  private async retrySetPresence(operation: () => Promise<boolean>): Promise<boolean> {
    this.retryCount++;
    const delay = this.config.retryDelay * Math.pow(2, this.retryCount - 1);
    
    logger.info({
      message: `Retrying presence operation (attempt ${this.retryCount}/${this.config.maxRetries})`,
      delay,
      timestamp: new Date().toISOString(),
      event: "presenceRetry",
    });

    await new Promise(resolve => setTimeout(resolve, delay));
    return await operation();
  }

  private logPresence(customMessage?: string): void {
    if (!this.config.enableLogging) return;

    const userPresence = this.client.user?.presence;
    logger.info({
      message: customMessage || "Bot presence updated",
      presence: {
        status: userPresence?.status,
        activities: userPresence?.activities.map(a => ({
          name: a.name,
          type: a.type,
          url: a.url,
        })),
        clientId: this.client.user?.id,
      },
      rotation: {
        isRotating: this.isRotating,
        currentIndex: this.currentActivityIndex,
        totalActivities: this.currentActivities.length,
      },
      timestamp: new Date().toISOString(),
      event: "presenceUpdate",
    });
  }

  destroy(): void {
    this.stopRotation();
    this.currentActivities = [];
    this.retryCount = 0;
    
    logger.info({
      message: "Presence helper destroyed",
      timestamp: new Date().toISOString(),
      event: "presenceHelperDestroyed",
    });
  }
}

export default PresenceHelper;