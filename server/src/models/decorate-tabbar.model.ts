import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'lm_decorate_tabbar' })
export class DecorateTabbar extends Model<DecorateTabbar> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true })
  id: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: '' })
  name: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  selected: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  unselected: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  link: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  create_time: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  update_time: number;
}
