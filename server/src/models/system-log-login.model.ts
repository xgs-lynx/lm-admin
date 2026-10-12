import { BeforeValidate, Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'lm_system_log_login',
  createdAt: false,
  updatedAt: false,
})
export class SystemLogLogin extends Model<SystemLogLogin> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true, comment: '主键' })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '管理员ID', field: 'admin_id' })
  adminId: number;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: '', comment: '登录账号' })
  username: string;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: '', comment: '登录地址' })
  ip: string;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '', comment: '操作系统' })
  os: string;

  @Column({ type: DataType.STRING(100), allowNull: true, defaultValue: '', comment: '浏览器' })
  browser: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1, comment: '操作状态: 1=成功, 2=失败' })
  status: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '创建时间', field: 'create_time' })
  createTime: number;

  @BeforeValidate
  static setCreateTime(data: SystemLogLogin) {
    data.createTime = Math.floor(Date.now() / 1000);
  }
}
