import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'lm_hot_search' })
export class HotSearch extends Model<HotSearch> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true, comment: '主键' })
  id: number;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '', comment: '关键词' })
  name: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '排序号' })
  sort: number;
}
