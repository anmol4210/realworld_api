const Sequelize = require('sequelize');
const {
  UserModel,
  UserDetailModel,
  ArticleModel,
  TagModel,
  CommentModel
} = require('./models');

const db = new Sequelize({
  dialect: 'sqlite',
  storage: __dirname + '/store.db'
})

const User = db.define('user', UserModel);
const UserDetails = db.define('userDetail', UserDetailModel);
const Article = db.define('article', ArticleModel);
const Tags = db.define('tag', TagModel);
const Comment = db.define('comment', CommentModel);

User.belongsTo(UserDetails, {
  foreignKey: 'user_id'
});
UserDetails.hasOne(User, {
  foreignKey: 'user_id'
});

UserDetails.belongsToMany(UserDetails, {
  as: 'follower',
  foreignKey: 'followingId',
  through: 'UserConnection'
})
UserDetails.belongsToMany(UserDetails, {
  as: 'following',
  foreignKey: 'followerId',
  through: 'UserConnection'
})

Article.belongsToMany(Tags, {
  foreignKey: 'article_id',
  through: 'ArticleTag'
})
Tags.belongsToMany(Article, {
  foreignKey: 'tagName',
  through: 'ArticleTag'
})

UserDetails.hasMany(Article, {
  foreignKey: 'user_id'
})
Article.belongsTo(UserDetails, {
  as: 'author',
  foreignKey: 'user_id'
})

Article.belongsToMany(UserDetails, {
  as: 'favoritedBy',
  foreignKey: 'article_id',
  through: 'Favorite'
})
UserDetails.belongsToMany(Article, {
  as: 'favoritedArticles',
  foreignKey: 'user_id',
  through: 'Favorite'
})

Article.hasMany(Comment, {
  foreignKey: 'article_id'
})
Comment.belongsTo(Article, {
  foreignKey: 'article_id'
})

UserDetails.hasMany(Comment, {
  foreignKey: 'user_id'
})
Comment.belongsTo(UserDetails, {
  as: 'writer',
  foreignKey: 'user_id'
})

db.sync()

module.exports = {
  db,
  User,
  UserDetails,
  Article,
  Tags,
  Comment
}
