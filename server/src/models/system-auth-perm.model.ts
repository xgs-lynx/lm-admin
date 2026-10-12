import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'lm_system_auth_perm',
  createdAt: false,
  updatedAt: false,
})
export class SystemAuthPerm extends Model<SystemAuthPerm> {
  @Column({ type: DataType.STRING(100), allowNull: false, primaryKey: true, defaultValue: '' })
  id: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '角色ID', field: 'role_id' })
  roleId: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '菜单ID', field: 'menu_id' })
  menuId: number;
}
