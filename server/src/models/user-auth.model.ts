import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'lm_user_auth',
  createdAt: false,
  updatedAt: false,
})
export class UserAuth extends Model<UserAuth> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'user_id' })
  userId: number;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  openid: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  unionid: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1 })
  client: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'create_time' })
  createTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'update_time' })
  updateTime: number;
}
