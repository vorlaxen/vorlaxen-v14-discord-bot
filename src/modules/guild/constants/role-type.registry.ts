import { GuildRoleType, GuildRoleTypes } from './role-types.constant';

export interface RoleTypeDefinition {
  key: GuildRoleType;
  label: string;
  description: string;
}

export const ROLE_TYPE_REGISTRY: Record<GuildRoleType, RoleTypeDefinition> = {
  [GuildRoleTypes.MEMBER_JOIN]: {
    key: GuildRoleTypes.MEMBER_JOIN,
    label: 'Gelen',
    description: 'Sunucuya katılan üyelere verilecek rol',
  },
};

export const ROLE_TYPE_LIST = Object.values(ROLE_TYPE_REGISTRY);

export function isValidRoleType(type: string): type is GuildRoleType {
  return type in ROLE_TYPE_REGISTRY;
}

export function getRoleTypeDefinition(
  type: string,
): RoleTypeDefinition | undefined {
  if (!isValidRoleType(type)) return undefined;
  return ROLE_TYPE_REGISTRY[type];
}

export function filterRoleTypes(query: string): RoleTypeDefinition[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return ROLE_TYPE_LIST;

  return ROLE_TYPE_LIST.filter(
    (entry) =>
      entry.label.toLowerCase().includes(normalized) ||
      entry.description.toLowerCase().includes(normalized),
  );
}
