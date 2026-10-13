import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'lm_user',
  createdAt: false,
  updatedAt: false,
})
export class User extends Model<User> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  sn: number;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  avatar: string;

  @Column({ type: DataType.STRING(32), allowNull: false, defaultValue: '', field: 'real_name' })
  realName: string;

  @Column({ type: DataType.STRING(32), allowNull: false, defaultValue: '' })
  nickname: string;

  @Column({ type: DataType.STRING(32), allowNull: false, defaultValue: '' })
  username: string;

  @Column({ type: DataType.STRING(32), allowNull: false, defaultValue: '' })
  password: string;

  @Column({ type: DataType.STRING(32), allowNull: false, defaultValue: '' })
  mobile: string;

  @Column({ type: DataType.STRING(32), allowNull: false, defaultValue: '' })
  salt: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  sex: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  channel: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, field: 'is_disable' })
  isDisable: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, field: 'is_delete' })
  isDelete: number;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: '', field: 'last_login_ip' })
  lastLoginIp: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'last_login_time' })
  lastLoginTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'create_time' })
  createTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'update_time' })
  updateTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'delete_time' })
  deleteTime: number;
}
