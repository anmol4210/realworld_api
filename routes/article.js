const route = require('express').Router();

const {
  Article,
  Tags,
  UserDetails,
  Comment
} = require('../db/index');
const {
  ensureTokenInHeader
} = require('../middlewares');
const {
  getIdFromToken
} = require('../services/jwt');
const {
  createSlug
} = require('../services/slugService');
const {
  generateUUID
} = require('../services/uuidService');

route.post('/', ensureTokenInHeader, async (req, res) => {

  const decryptedToken = getIdFromToken(req.headers.token);
  if (decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: "Invalid Token"
      }
    })
  } else {
    const {
      title,
      description,
      body,
      tagList
    } = req.body.article;
    const authorId = decryptedToken.id;
    const slug = createSlug(title);
    const article_id = generateUUID();

    try {

      const article = await Article.create({
        article_id,
        title,
        description,
        body,
        slug
      })

      await article.setAuthor(authorId)
      const author = await article.getAuthor();

      if (tagList) {
        for (let tag of tagList) {
          const newTag = await Tags.findOrCreate({
            where: {
              tagName: tag
            }
          })
          await article.addTag(newTag[0])
        }
      }

      return res.status(200).json({
        article: {
          slug,
          title,
          description,
          body,
          tagList,
          createdAt: article.dataValues.createdAt,
          updatedAt: article.dataValues.updatedAt,
          favorited: false,
          favoritesCount: 0,
          author: {
            username: author.dataValues.username,
            bio: author.dataValues.bio,
            image: author.dataValues.image,
            following: false
          }
        }
      })

    } catch (err) {
      return res.status(500).json({
        errors: {
          message: err.message
        }
      })
    }

  }
})

route.get('/:slug', async (req, res) => {

  let userDetails = undefined;

  if (req.headers.token) {
    const decryptedToken = getIdFromToken(req.headers.token);
    if (decryptedToken.error) {
      return res.status(401).json({
        errors: {
          message: "Invalid Token"
        }
      })
    }

    try {
      userDetails = await UserDetails.findByPk(decryptedToken.id);
    } catch (err) {
      return res.status(500).json({
        errors: {
          message: err.message
        }
      })
    }
  }

  let article;

  try {
    article = await Article.findOne({
      where: {
        slug: req.params.slug
      },
      include: [{
        model: UserDetails,
        as: 'author',
        attributes: ['username', 'bio', 'image']
      }]
    })
    if (!article) {
      throw {
        message: 'Article not found'
      }
    }
  } catch (err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }

  const authorDetails = await article.getAuthor();

  let isFollowing = false;
  let isFavorited = false;
  if (userDetails) {
    isFollowing = await authorDetails.hasFollower(userDetails);
    isFavorited = await article.hasFavoritedBy(userDetails);
  }

  let favoritesCount = await article.countFavoritedBy();
  const tags = (await article.getTags()).map(tag => {
    return tag.tagName
  })

  article = article.toJSON();
  article.favorited = isFavorited;
  article.favoritesCount = favoritesCount;
  article.tagList = tags;
  article.article_id = undefined;
  article.user_id = undefined;
  article.author.following = isFollowing;

  res.status(200).json({
    article
  })
})

route.put('/:slug', ensureTokenInHeader, async (req, res) => {
  const decryptedToken = getIdFromToken(req.headers.token);
  if (decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: "Invalid Token"
      }
    })
  } else {
    let {
      title,
      description,
      body
    } = req.body.article;
    let userDetails = undefined;

    try {
      userDetails = await UserDetails.findByPk(decryptedToken.id);
    } catch (err) {
      return res.status(500).json({
        errors: {
          message: err.message
        }
      })
    }

    try {
      article = await Article.findOne({
        where: {
          slug: req.params.slug
        },
        include: [{
          model: UserDetails,
          as: 'author',
          attributes: ['username', 'bio', 'image']
        }]
      })
      if (!article) {
        throw {
          message: 'Article not found'
        }
      }
    } catch (err) {
      return res.status(500).json({
        errors: {
          message: err.message
        }
      })
    }

    let authorDetails = await article.getAuthor();
    let favoritesCount = await article.countFavoritedBy();

    if (authorDetails.user_id !== userDetails.user_id) {
      return res.status(403).json({
        errors: {
          message: 'Article can only be updated by author'
        }
      })
    }

    if (title) {
      article.title = title;
      article.slug = createSlug(title);
    }

    if (description) {
      article.description = description;
    }

    if (body) {
      article.body = body;
    }

    try {
      article.favoritesCount = favoritesCount
      let updatedArticle = await article.save();

      const tags = (await updatedArticle.getTags()).map(tag => {
        return tag.tagName
      })

      updatedArticle = updatedArticle.toJSON();
      updatedArticle.favorited = false;
      updatedArticle.tagList = tags;
      updatedArticle.article_id = undefined;
      updatedArticle.user_id = undefined;
      updatedArticle.author.following = false;

      return res.status(200).json({
        article: updatedArticle
      })
    } catch (err) {
      res.status(500).json({
        errors: {
          message: err.message
        }
      })
    }
  }
})

route.get('/', async (req, res) => {

  let {
    tag,
    author,
    favorited,
    limit,
    offset
  } = req.query;

  if (!limit) {
    limit = 20;
  }

  if (!offset) {
    offset = 0;
  }

  try {
    let userDetails = undefined;
    let favoritedByUserDetails = undefined;

    if (req.headers.token) {

      const decryptedToken = getIdFromToken(req.headers.token);

      if (decryptedToken.error) {
        return res.status(401).json({
          errors: {
            message: ["Invalid Token"]
          }
        })
      }

      userDetails = await UserDetails.findByPk(decryptedToken.id);
    }

    let articles = [];

    if (favorited) {
      favoritedByUserDetails = await UserDetails.findOne({
        where: {
          username: favorited
        }
      })

      if (!favoritedByUserDetails) {
        return res.status(404).json({
          error: {
            message: 'User not found'
          }
        })
      }
      articles = await favoritedByUserDetails.getFavoritedArticles();
    } else if (tag) {
      let tagDetails = await Tags.findByPk(tag)

      articles = await tagDetails.getArticles();
    } else {
      articles = await Article.findAll({
        include: [{
          model: UserDetails,
          as: 'author',
          attributes: ['username', 'bio', 'image']
        }],
        limit: limit,
        offset: offset
      });
    }

    if (!articles) {
      throw {
        message: 'Articles not found'
      }
    }

    let articleList = [];

    for (let article of articles) {
      let authorDetails = await article.getAuthor();

      let favoritesCount = await article.countFavoritedBy();

      let isFollowing = false;
      let isFavorited = false;
      if (userDetails) {
        isFollowing = await authorDetails.hasFollower(userDetails);
        isFavorited = await article.hasFavoritedBy(userDetails);
      }

      let tags = (await article.getTags()).map(tag => {
        return tag.tagName
      })

      article = article.toJSON();
      article.favorited = isFavorited;
      article.favoritesCount = favoritesCount
      article.tagList = tags;
      article.article_id = undefined;
      article.user_id = undefined;
      if (favorited || tag) {
        article.author = {
          username: authorDetails.username,
          bio: authorDetails.bio,
          image: authorDetails.image
        }
        article.Favorite = undefined
        article.ArticleTag = undefined
      }
      article.author.following = isFollowing;

      if (!author) {
        articleList.push(article);
      } else if (article.author.username === author) {
        articleList.push(article);
      }
    }
    return res.status(200).json({
      articles: articleList,
      articlesCount: articleList.length
    })

  } catch (err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }
})

route.post('/:slug/favorite', ensureTokenInHeader, async (req, res) => {
  const decryptedToken = getIdFromToken(req.headers.token);
  if (decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: ["Invalid Token"]
      }
    })
  }

  let userDetails;
  try {
    userDetails = await UserDetails.findByPk(decryptedToken.id);
  } catch (err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }

  let article;

  try {
    article = await Article.findOne({
      where: {
        slug: req.params.slug
      },
      include: [{
        model: UserDetails,
        as: 'author',
        attributes: ['username', 'bio', 'image']
      }]
    })
    if (!article) {
      throw {
        message: 'Article not found'
      }
    }
  } catch (err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }
  const authorDetails = await article.getAuthor();

  if (authorDetails.user_id === userDetails.user_id) {
    return res.status(403).json({
      error: {
        message: 'Article can not be favorited by author'
      }
    })
  }

  await article.addFavoritedBy(userDetails);
  let favoritesCount = await article.countFavoritedBy();

  let isFollowing = false;
  if (userDetails) {
    isFollowing = await authorDetails.hasFollower(userDetails);
  }

  const tags = (await article.getTags()).map(tag => {
    return tag.tagName
  })

  article = article.toJSON();
  article.favorited = true;
  article.favoritesCount = favoritesCount;
  article.tagList = tags;
  article.article_id = undefined;
  article.user_id = undefined;
  article.author.following = isFollowing;

  return res.status(200).json({
    article
  })
})

route.delete('/:slug/favorite', ensureTokenInHeader, async (req, res) => {
  const decryptedToken = getIdFromToken(req.headers.token);
  if (decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: ["Invalid Token"]
      }
    })
  }

  let userDetails;
  try {
    userDetails = await UserDetails.findByPk(decryptedToken.id);
  } catch (err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }

  let article;

  try {
    article = await Article.findOne({
      where: {
        slug: req.params.slug
      },
      include: [{
        model: UserDetails,
        as: 'author',
        attributes: ['username', 'bio', 'image']
      }]
    })
    if (!article) {
      throw {
        message: 'Article not found'
      }
    }
  } catch (err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }
  const authorDetails = await article.getAuthor();

  if (authorDetails.user_id === userDetails.user_id) {
    return res.status(403).json({
      error: {
        message: 'Article can not be unfavorited by author'
      }
    })
  }

  await article.removeFavoritedBy(userDetails);
  let favoritesCount = await article.countFavoritedBy();

  let isFollowing = false;
  if (userDetails) {
    isFollowing = await authorDetails.hasFollower(userDetails);
  }

  const tags = (await article.getTags()).map(tag => {
    return tag.tagName
  })

  article = article.toJSON();
  article.favorited = false;
  article.favoritesCount = favoritesCount;
  article.tagList = tags;
  article.article_id = undefined;
  article.user_id = undefined;
  article.author.following = isFollowing;

  return res.status(200).json({
    article
  })
})

route.delete('/:slug', ensureTokenInHeader, async (req, res) => {
  const decryptedToken = getIdFromToken(req.headers.token);
  if (decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: ["Invalid Token"]
      }
    })
  }

  let userDetails;
  try {
    userDetails = await UserDetails.findByPk(decryptedToken.id);
  } catch (err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }

  let article;

  try {
    article = await Article.findOne({
      where: {
        slug: req.params.slug
      },
      include: [{
        model: UserDetails,
        as: 'author',
        attributes: ['username', 'bio', 'image']
      }]
    })
    if (!article) {
      throw {
        message: 'Article not found'
      }
    }
  } catch (err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }
  const authorDetails = await article.getAuthor();

  if (authorDetails.user_id !== userDetails.user_id) {
    return res.status(403).json({
      error: {
        message: 'Article can only be deleted by author'
      }
    })
  }

  try {
    await article.destroy()
  } catch (err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }

  return res.sendStatus(202);
})

route.get('/:slug/comments', async (req, res) => {
  let userDetails = undefined;

  if (req.headers.token) {
    const decryptedToken = getIdFromToken(req.headers.token);
    if (decryptedToken.error) {
      return res.status(401).json({
        errors: {
          message: ["Invalid Token"]
        }
      })
    }

    try {
      userDetails = await UserDetails.findByPk(decryptedToken.id);
    } catch (err) {
      return res.status(500).json({
        errors: {
          message: err.message
        }
      })
    }
  }

  let article;

  try {
    article = await Article.findOne({
      where: {
        slug: req.params.slug
      },
      include: [{
        model: UserDetails,
        as: 'author',
        attributes: ['username', 'bio', 'image']
      }]
    })
    if (!article) {
      throw {
        message: 'Article not found'
      }
    }

    let comments = await article.getComments();

    let commentList = [];
    for (let comment of comments) {
      let writer = await comment.getWriter();

      let isFollowing = false;
      if (userDetails) {
        isFollowing = await writer.hasFollower(userDetails);
      }

      comment = comment.toJSON();
      comment.article_id = undefined
      comment.user_id = undefined
      comment.id = comment.comment_id
      comment.comment_id = undefined
      comment.author = {
        username: writer.username,
        bio: writer.bio,
        image: writer.image,
        following: isFollowing,
      }

      commentList.push(comment);
    }

    return res.status(200).json({
      comments: commentList
    })
  } catch (err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }

})

route.post('/:slug/comments', ensureTokenInHeader, async (req, res) => {
  const decryptedToken = getIdFromToken(req.headers.token);
  if (decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: ["Invalid Token"]
      }
    })
  }

  try {
    let article = await Article.findOne({
      where: {
        slug: req.params.slug
      }
    })
    if (!article) {
      throw {
        message: 'Article not found'
      }
    }


    let userDetails = await UserDetails.findByPk(decryptedToken.id);

    let comment = await Comment.create({
      comment_id: generateUUID(),
      body: req.body.comment.body
    })

    await comment.setWriter(userDetails);
    await comment.setArticle(article);

    return res.status(200).json({
      comment: {
        id: comment.comment_id,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        body: comment.body,
        author: {
          username: userDetails.username,
          bio: userDetails.bio,
          image: userDetails.image,
          following: false
        }
      }
    })

  } catch (err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }
})

route.delete('/:slug/comments/:id', ensureTokenInHeader, async (req, res) => {
  const decryptedToken = getIdFromToken(req.headers.token);
  if (decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: ["Invalid Token"]
      }
    })
  }

  try {
    let article = await Article.findOne({
      where: {
        slug: req.params.slug
      }
    })
    if (!article) {
      throw {
        message: 'Article not found'
      }
    }

    let userDetails = await UserDetails.findByPk(decryptedToken.id);

    let comment = await Comment.findByPk(req.params.id)

    if (await article.hasComment(comment)) {
      let writer = await comment.getWriter();

      if (writer.username === userDetails.username) {
        comment.destroy()
        return res.sendStatus(202);
      } else {
        return res.status(403).json({
          error: {
            message: 'Comment can only be deleted by its writer'
          }
        })
      }
    } else {
      return res.status(403).json({
        error: {
          message: 'Comment can only be deleted by its writer'
        }
      })
    }
  } catch (err) {
    return res.status(500).json({
      error: {
        message: err.message
      }
    })
  }

})

module.exports = route;
