export interface BackgroundJobPayload {
  action: string;
  data?: Record<string, unknown>;
  meta?: {
    correlationId?: string;
    source?: string;
    userId?: string | null;
    guildId?: string | null;
  };
}

export interface BackgroundJobResult {
  success: boolean;
  action: string;
}
