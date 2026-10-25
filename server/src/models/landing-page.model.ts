import { Column, DataType, Model, Table } from 'sequelize-typescript';
import moment from 'moment';

const fmt = (v: number) => {
  const timestamp = v * 1000;
  return (timestamp > 0 && moment(timestamp).format('YYYY-MM-DD HH:mm:ss')) || '';
};

@Table({
  tableName: 'lm_landing_page',
  createdAt: false,
  updatedAt: false,
})
export class LandingPage extends Model<LandingPage> {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: '' })
  title: string;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: '' })
  slug: string;

  @Column({ type: DataType.STRING(300), allowNull: false, defaultValue: '' })
  subtitle: string;

  @Column({ type: DataType.STRING(255), allowNull: false, defaultValue: '' })
  cover: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    defaultValue: '',
    field: 'cta_text',
  })
  ctaText: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    defaultValue: '',
    field: 'cta_link',
  })
  ctaLink: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    defaultValue: 'default.hbs',
    field: 'template_file',
  })
  templateFile: string;

  @Column({ type: DataType.TEXT('medium'), allowNull: true, defaultValue: '' })
  content: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    defaultValue: '',
    field: 'seo_title',
  })
  seoTitle: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    defaultValue: '',
    field: 'seo_keywords',
  })
  seoKeywords: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    defaultValue: '',
    field: 'seo_description',
  })
  seoDescription: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  sort: number;

  @Column({
    type: DataType.SMALLINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    field: 'is_show',
  })
  isShow: number;

  @Column({
    type: DataType.SMALLINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    field: 'is_delete',
  })
  isDelete: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    field: 'create_time',
    get() {
      return fmt(this.getDataValue('createTime'));
    },
  })
  createTime: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    field: 'update_time',
    get() {
      return fmt(this.getDataValue('updateTime'));
    },
  })
  updateTime: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    field: 'delete_time',
    get() {
      return fmt(this.getDataValue('deleteTime'));
    },
  })
  deleteTime: number;
}
