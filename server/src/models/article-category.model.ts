import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'lm_article_category' })
export class ArticleCategory extends Model<ArticleCategory> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true })
  id: number;

  @Column({ type: DataType.STRING(60), allowNull: false, defaultValue: '' })
  name: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 50 })
  sort: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1 })
  is_show: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  is_delete: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 })
  create_time: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 })
  update_time: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 })
  delete_time: number;
}
