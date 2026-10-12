import { Column, DataType, Model, Table } from 'sequelize-typescript';
import moment from 'moment';

const fmt = (v: number) => moment(v * 1000).format('YYYY-MM-DD HH:mm:ss');

@Table({
  tableName: 'lm_system_auth_menu',
  createdAt: false,
  updatedAt: false,
})
export class SystemAuthMenu extends Model<SystemAuthMenu> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  pid: number;

  @Column({ type: DataType.CHAR(2), allowNull: false, defaultValue: '', field: 'menu_type' })
  menuType: string;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '', field: 'menu_name' })
  menuName: string;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '', field: 'menu_icon' })
  menuIcon: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, field: 'menu_sort' })
  menuSort: number;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '' })
  perms: string;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '' })
  paths: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  component: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  selected: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  params: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, field: 'is_cache' })
  isCache: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1, field: 'is_show' })
  isShow: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, field: 'is_disable' })
  isDisable: number;

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
}
