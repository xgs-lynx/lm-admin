import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'lm_official_reply' })
export class OfficialReply extends Model<OfficialReply> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true, comment: '主键' })
  id: number;

  @Column({ type: DataType.STRING(64), allowNull: false, defaultValue: '', comment: '规则名' })
  name: string;

  @Column({ type: DataType.STRING(64), allowNull: false, defaultValue: '', comment: '关键词' })
  keyword: string;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '回复类型: [1=关注回复 2=关键字回复, 3=默认回复]', field: 'reply_type' })
  replyType: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1, comment: '匹配方式: [1=全匹配, 2=模糊匹配]', field: 'matching_type' })
  matchingType: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1, comment: '内容类型: [1=文本]', field: 'content_type' })
  contentType: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '启动状态: [1=启动, 0=关闭]' })
  status: number;

  @Column({ type: DataType.TEXT, allowNull: false, comment: '回复内容' })
  content: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 50, comment: '排序编号' })
  sort: number;

  @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0, comment: '是否删除', field: 'is_delete' })
  isDelete: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '创建时间', field: 'create_time' })
  createTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '更新时间', field: 'update_time' })
  updateTime: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '删除时间', field: 'delete_time' })
  deleteTime: number;
}
