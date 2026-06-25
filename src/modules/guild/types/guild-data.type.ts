export interface GuildMessageConfig {
  template?: string;
  useEmbed?: boolean;
}

export interface GuildData {
  messages?: {
    member_join?: GuildMessageConfig;
    member_leave?: GuildMessageConfig;
  };
  meta?: {
    name?: string;
    leftAt?: string;
  };
}
