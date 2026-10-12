import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'lm_article' })
export class Article extends Model<Article> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true })
  id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  cid: number;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  title: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  intro: string;

  @Column({ type: DataType.STRING(200), allowNull: true, defaultValue: '' })
  summary: string;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  image: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  content: string;

  @Column({ type: DataType.STRING(32), allowNull: false, defaultValue: '' })
  author: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  visit: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 50 })
  sort: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  is_show: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  is_delete: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  create_time: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  update_time: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  delete_time: number;
}
