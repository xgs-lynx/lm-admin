import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'lm_system_log_sms',
  createdAt: false,
  updatedAt: false,
})
export class SystemLogSms extends Model<SystemLogSms> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true, comment: 'id' })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '场景编号' })
  scene: number;

  @Column({ type: DataType.STRING(11), allowNull: false, defaultValue: '', comment: '手机号码' })
  mobile: string;

  @Column({ type: DataType.STRING(255), allowNull: false, defaultValue: '', comment: '发送内容' })
  content: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '发送状态：[0=发送中, 1=发送成功, 2=发送失败]' })
  status: number;

  @Column({ type: DataType.TEXT, allowNull: true, comment: '短信结果' })
  results: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '发送时间', field: 'send_time' })
  sendTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '创建时间', field: 'create_time' })
  createTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '更新时间', field: 'update_time' })
  updateTime: number;
}
