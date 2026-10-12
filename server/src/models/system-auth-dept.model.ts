import { Column, DataType, Model, Table } from 'sequelize-typescript';
import moment from 'moment';

const fmt = (v: number) => moment(v * 1000).format('YYYY-MM-DD HH:mm:ss');

@Table({
  tableName: 'lm_system_auth_dept',
  createdAt: false,
  updatedAt: false,
})
export class SystemAuthDept extends Model<SystemAuthDept> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true, comment: '主键' })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '上级主键' })
  pid: number;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '', comment: '部门名称' })
  name: string;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: '', comment: '负责人名' })
  duty: string;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: '', comment: '联系电话' })
  mobile: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '排序编号' })
  sort: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '是否禁用: 0=否, 1=是', field: 'is_stop' })
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
