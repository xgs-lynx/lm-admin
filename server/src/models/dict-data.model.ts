import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'lm_dict_data',
  createdAt: false,
  updatedAt: false,
})
export class DictData extends Model<DictData> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'type_id' })
  typeId: number;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '' })
  name: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  value: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  remark: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  sort: number;

  @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 1 })
  status: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, field: 'is_delete' })
  isDelete: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'create_time' })
  createTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'update_time' })
  updateTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'delete_time' })
  deleteTime: number;
}
