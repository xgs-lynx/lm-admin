import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'lm_decorate_page',
  createdAt: false,
  updatedAt: false,
})
export class DecoratePage extends Model<DecoratePage> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true })
  id: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 10 })
  page_type: number;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '' })
  page_name: string;

  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: '' })
  page_data: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  create_time: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  update_time: number;
}
