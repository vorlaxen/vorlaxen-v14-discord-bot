import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { GuildData } from '../../types/guild-data.type';
import { GuildChannel } from './guild-channel.entity';
import { GuildRole } from './guild-role.entity';

@Entity('guilds')
@Index(['discordGuildId'], { unique: true })
export class Guild {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'discord_guild_id', type: 'varchar', length: 32 })
  discordGuildId: string;

  @Column({ type: 'jsonb', default: {} })
  data: GuildData;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => GuildChannel, (channel) => channel.guild)
  channels: GuildChannel[];

  @OneToMany(() => GuildRole, (role) => role.guild)
  roles: GuildRole[];
}
