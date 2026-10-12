import { Column, DataType, Model, Table } from 'sequelize-typescript';
import moment from 'moment';

const fmt = (v: number) => moment(v * 1000).format('YYYY-MM-DD HH:mm:ss');

@Table({
  tableName: 'lm_album_cate',
  createdAt: false,
  updatedAt: false,
})
export class AlbumCate extends Model<AlbumCate> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  pid: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 10 })
  type: number;

  @Column({ type: DataType.STRING(32), allowNull: false, defaultValue: '' })
  name: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'is_delete' })
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
