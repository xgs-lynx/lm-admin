import { Column, DataType, Model, Table } from 'sequelize-typescript';
import moment from 'moment';

const fmt = (v: number) => moment(v * 1000).format('YYYY-MM-DD HH:mm:ss');

@Table({
  tableName: 'lm_system_auth_role',
  createdAt: false,
  updatedAt: false,
})
export class SystemAuthRole extends Model<SystemAuthRole> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true, defaultValue: 0, comment: '主键' })
  id: number;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '', comment: '角色名称' })
  name: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '', comment: '备注信息' })
  remark: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '角色排序' })
  sort: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '是否禁用: 0=否, 1=是', field: 'is_disable' })
  isDisable: number;

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
}
