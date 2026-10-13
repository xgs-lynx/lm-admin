import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'lm_notice_setting',
  createdAt: false,
  updatedAt: false,
})
export class NoticeSetting extends Model<NoticeSetting> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true, comment: '场景编号' })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '场景名称' })
  scene: number;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '', comment: '场景描述' })
  name: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '', comment: '通知类型: [1=业务, 2=验证]' })
  remarks: string;

  @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 1, comment: '接收人员: [1=用户, 2=平台]' })
  recipient: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1, comment: '通知类型: [1=业务, 2=验证]' })
  type: number;

  @Column({ type: DataType.TEXT, allowNull: true, comment: '系统的通知设置', field: 'system_notice' })
  systemNotice: string;

  @Column({ type: DataType.TEXT, allowNull: true, comment: '短信的通知设置', field: 'sms_notice' })
  smsNotice: string;

  @Column({ type: DataType.TEXT, allowNull: true, comment: '公众号通知设置', field: 'oa_notice' })
  oaNotice: string;

  @Column({ type: DataType.TEXT, allowNull: true, comment: '小程序通知设置', field: 'mnp_notice' })
  mnpNotice: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '是否删除', field: 'is_delete' })
  isDelete: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '创建时间', field: 'create_time' })
  createTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '更新时间', field: 'update_time' })
  updateTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '删除时间', field: 'delete_time' })
  deleteTime: number;
}
