const Sequelize = require('sequelize');
const DT = Sequelize.DataTypes;

const UserModel = {
  user_id: DT.UUID,
  password: {
    type: DT.STRING(45),
    allowNull: false
  }
}

const UserDetailModel = {
  user_id: {
    type: DT.UUID,
    primaryKey: true,
    defaultValue: DT.UUIDV1
  },
  email: {
    type: DT.STRING(45),
    unique: true,
    allowNull: false
  },
  username: {
    type: DT.STRING(45),
    unique: true,
    allowNull: false
  },
  bio: DT.STRING(200),
  image: DT.STRING(200)
}

const ArticleModel = {
  article_id: {
    type: DT.UUID,
    primaryKey: true,
    defaultValue: DT.UUIDV1
  },
  slug: {
    type: DT.STRING(100),
    unique: true
  },
  title: DT.STRING(100),
  description: DT.STRING(200),
  body: DT.STRING(1000),
  favoritesCount: {
    type: DT.INTEGER,
    defaultValue: 0
  }
}

const TagModel = {
  tagName: {
    type: DT.STRING(20),
    primaryKey: true
  }
}

const CommentModel = {
  comment_id: {
    type: DT.UUID,
    primaryKey: true,
    defaultValue: DT.UUIDV1
  },
  body: DT.STRING(100)
}

module.exports = {
  UserModel,
  UserDetailModel,
  ArticleModel,
  TagModel,
  CommentModel
}
