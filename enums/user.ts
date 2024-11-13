export enum Role {
  RoleUser = 1, // 普通用户
  RoleAdmin = 10, // 管理员
  RoleRoot = 100 // 超级管理员
}

export const RoleValue = {
  [Role.RoleUser]: 'user',
  [Role.RoleAdmin]: 'admin',
  [Role.RoleRoot]: 'root'
};

export const RoleValueText = {
  [Role.RoleUser]: '普通用户',
  [Role.RoleAdmin]: '管理员',
  [Role.RoleRoot]: '超级管理员'
};
