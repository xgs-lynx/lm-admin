import { Column, DataType, Model, Table } from 'sequelize-typescript';
import moment from 'moment';

const fmt = (v: number) => {
  const timestamp = v * 1000;
  return (timestamp > 0 && moment(timestamp).format('YYYY-MM-DD HH:mm:ss')) || '';
};

@Table({
  tableName: 'lm_dict_type',
  createdAt: false,
  updatedAt: false,
})
export class DictType extends Model<DictType> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true })
  id: number;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '', field: 'dict_name' })
  dictName: string;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '', field: 'dict_type' })
  dictType: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '', field: 'dict_remark' })
  dictRemark: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1, field: 'dict_status' })
  dictStatus: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, field: 'is_delete' })
  isDelete: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'create_time',
    get() { return fmt(this.getDataValue('createTime')); },
  })
  createTime: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'update_time',
    get() { return fmt(this.getDataValue('updateTime')); },
  })
  updateTime: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'delete_time',
    get() { return fmt(this.getDataValue('deleteTime')); },
  })
  deleteTime: number;
}
