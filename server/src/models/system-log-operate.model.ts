import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';
import { SystemAuthAdmin } from './system-auth-admin.model';

@Table({
  tableName: 'lm_system_log_operate',
  createdAt: false,
  updatedAt: false,
})
export class SystemLogOperate extends Model<SystemLogOperate> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true, comment: '主键' })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '操作人ID', field: 'admin_id' })
  adminId: number;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: '', comment: '请求类型: GET/POST/PUT' })
  type: string;

  @Column({ type: DataType.STRING(30), allowNull: true, defaultValue: '', comment: '操作标题' })
  title: string;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: '', comment: '请求IP' })
  ip: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '', comment: '请求接口' })
  url: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '', comment: '请求方法' })
  method: string;

  @Column({ type: DataType.TEXT, allowNull: true, comment: '请求参数' })
  args: string;

  @Column({ type: DataType.TEXT, allowNull: true, comment: '错误信息' })
  error: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1, comment: '执行状态: 1=成功, 2=失败' })
  status: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '开始时间', field: 'start_time' })
  startTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '结束时间', field: 'end_time' })
  endTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '执行耗时', field: 'task_time' })
  taskTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '创建时间', field: 'create_time' })
  createTime: number;

  // SystemAuthAdmin 表建立多对一关系
  @BelongsTo(() => SystemAuthAdmin, { foreignKey: 'adminId', as: 'admin' })
  admin: SystemAuthAdmin;
}
