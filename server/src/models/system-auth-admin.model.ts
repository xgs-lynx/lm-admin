import { Column, DataType, Model, Table, BelongsTo } from 'sequelize-typescript';
import moment from 'moment';
import { SystemAuthRole } from './system-auth-role.model';
import { SystemAuthDept } from './system-auth-dept.model';

const fmt = (v: number) => moment(v * 1000).format('YYYY-MM-DD HH:mm:ss');

@Table({
  tableName: 'lm_system_auth_admin',
  createdAt: false,
  updatedAt: false,
})
export class SystemAuthAdmin extends Model<SystemAuthAdmin> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true, comment: '主键' })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '部门ID', field: 'dept_id' })
  deptId: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '岗位ID', field: 'post_id' })
  postId: number;

  @Column({ type: DataType.STRING(32), allowNull: false, defaultValue: '', comment: '用户账号' })
  username: string;

  @Column({ type: DataType.STRING(32), allowNull: false, defaultValue: '', comment: '用户昵称' })
  nickname: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '', comment: '用户密码' })
  password: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '', comment: '用户头像' })
  avatar: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '', comment: '角色主键' })
  role: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: '', comment: '加密盐巴' })
  salt: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '排序编号' })
  sort: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '多端登录: 0=否, 1=是', field: 'is_multipoint' })
  isMultipoint: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '是否禁用: 0=否, 1=是', field: 'is_disable' })
  isDisable: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '是否删除: 0=否, 1=是', field: 'is_delete' })
  isDelete: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: '', comment: '最后登录IP', field: 'last_login_ip' })
  lastLoginIp: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '最后登录', field: 'last_login_time',
    get() { return fmt(this.getDataValue('lastLoginTime')); },
  })
  lastLoginTime: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '创建时间', field: 'create_time',
    get() { return fmt(this.getDataValue('createTime')); },
  })
  createTime: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '更新时间', field: 'update_time',
    get() { return fmt(this.getDataValue('updateTime')); },
  })
  updateTime: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '删除时间', field: 'delete_time',
    get() { return fmt(this.getDataValue('deleteTime')); },
  })
  deleteTime: number;

  // SystemAuthRole 表建立多对一关系
  @BelongsTo(() => SystemAuthRole, { foreignKey: 'role', as: 'authRole' })
  authRole: SystemAuthRole;

  // SystemAuthDept 表建立多对一关系
  @BelongsTo(() => SystemAuthDept, { foreignKey: 'deptId', as: 'dept' })
  dept: SystemAuthDept;
}
