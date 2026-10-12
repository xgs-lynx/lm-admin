import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'lm_system_config',
  createdAt: false,
  updatedAt: false,
})
export class SystemConfig extends Model<SystemConfig> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true, comment: '主键' })
  id: number;

  @Column({ type: DataType.STRING(30), allowNull: true, defaultValue: '', comment: '类型' })
  type: string;

  @Column({ type: DataType.STRING(60), allowNull: false, defaultValue: '', comment: '键' })
  name: string;

  @Column({ type: DataType.TEXT, allowNull: true, comment: '值' })
  value: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0, comment: '创建时间', field: 'create_time' })
  createTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0, comment: '更新时间', field: 'update_time' })
  updateTime: number;
}
