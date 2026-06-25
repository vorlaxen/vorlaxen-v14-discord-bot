import { Guild, GuildMember, User } from 'discord.js';

export interface TemplateContext {
  user: User | GuildMember;
  guild: Guild;
}

export function renderTemplate(
  template: string,
  context: TemplateContext,
): string {
  const user =
    context.user instanceof GuildMember
      ? context.user.user
      : context.user;

  const replacements: Record<string, string> = {
    '{user}': user.toString(),
    '{user.tag}': user.tag,
    '{user.id}': user.id,
    '{user.name}': user.username,
    '{guild}': context.guild.name,
    '{guild.id}': context.guild.id,
    '{memberCount}': String(context.guild.memberCount),
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }
  return result;
}
