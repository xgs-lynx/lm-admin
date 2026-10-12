import { Column, DataType, Model, Table } from 'sequelize-typescript';
import moment from 'moment';

const fmt = (v: number) => moment(v * 1000).format('YYYY-MM-DD HH:mm:ss');

@Table({
  tableName: 'lm_system_auth_post',
  createdAt: false,
  updatedAt: false,
})
export class SystemAuthPost extends Model<SystemAuthPost> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true, defaultValue: 0, comment: '主键' })
  id: number;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: '', comment: '岗位编码' })
  code: string;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: '', comment: '岗位名称' })
  name: string;

  @Column({ type: DataType.STRING(250), allowNull: false, defaultValue: '', comment: '岗位备注' })
  remarks: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '岗位排序' })
  sort: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '是否停用: 0=否, 1=是', field: 'is_stop' })
  isStop: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '是否删除: 0=否, 1=是', field: 'is_delete' })
  isDelete: number;

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
}
