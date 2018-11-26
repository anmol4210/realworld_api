# Writeup API

Writeup API is a backend that adheres to [RealWorld](https://github.com/gothinkster/realworld-example-apps) API spec. It provides endpoints like authentication, registration and some other CRUD operations.

## Installation guide
```
Clone this repositiory.
Run 'npm install'
Run 'node server.js'

The app will be deployed at http://localhost:8080/
```

# Code Overview

## Dependencies
* [bcryptjs](https://www.npmjs.com/package/bcryptjs) - Lib to help you hash passwords.
* [connect-flash](https://www.npmjs.com/package/connect-flash) - The flash is a special area of the session used for storing messages.
* [expressjs](https://github.com/expressjs/express) - The server for handling and routing HTTP requests
* [express-session](https://www.npmjs.com/package/express-session) - Create a session middleware with the given options
* [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) - An implementation of JSON Web Tokens.
* [passport](https://www.npmjs.com/package/passport) - Passport is Express-compatible authentication middleware for Node.js.
* [passport-local](https://www.npmjs.com/package/passport-local) - Passport strategy for authenticating with a username and password.
* [sequelize](https://www.npmjs.com/package/sequelize) - Sequelize is a promise-based Node.js ORM for Postgres, MySQL, SQLite and Microsoft SQL Server.
* [slug](https://www.npmjs.com/package/slug) - slugifies every string, even when it contains unicode!
* [sqlite3](https://www.npmjs.com/package/sqlite3) - Asynchronous, non-blocking SQLite3 bindings for Node.js.
* [uuid](https://www.npmjs.com/package/uuid) - Simple, fast generation of UUIDS.

### Authentication Header:

`token: jwt.token.here`

## JSON Objects returned by API:

Make sure the right content type like `Content-Type: application/json; charset=utf-8` is correctly returned.

### Users (for authentication)

```JSON
{
  "user": {
    "email": "jake@jake.jake",
    "token": "jwt.token.here",
    "username": "jake",
    "bio": "I work at statefarm",
    "image": null
  }
}
```

### Profile

```JSON
{
  "profile": {
    "username": "jake",
    "bio": "I work at statefarm",
    "image": "https://static.productionready.io/images/smiley-cyrus.jpg",
    "following": false
  }
}
```

### Single Article

```JSON
{
  "article": {
    "slug": "how-to-train-your-dragon",
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "It takes a Jacobian",
    "tagList": ["dragons", "training"],
    "createdAt": "2016-02-18T03:22:56.637Z",
    "updatedAt": "2016-02-18T03:48:35.824Z",
    "favorited": false,
    "favoritesCount": 0,
    "author": {
      "username": "jake",
      "bio": "I work at statefarm",
      "image": "https://i.stack.imgur.com/xHWG8.jpg",
      "following": false
    }
  }
}
```

### Multiple Articles

```JSON
{
  "articles":[{
    "slug": "how-to-train-your-dragon",
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "It takes a Jacobian",
    "tagList": ["dragons", "training"],
    "createdAt": "2016-02-18T03:22:56.637Z",
    "updatedAt": "2016-02-18T03:48:35.824Z",
    "favorited": false,
    "favoritesCount": 0,
    "author": {
      "username": "jake",
      "bio": "I work at statefarm",
      "image": "https://i.stack.imgur.com/xHWG8.jpg",
      "following": false
    }
  }, {
    "slug": "how-to-train-your-dragon-2",
    "title": "How to train your dragon 2",
    "description": "So toothless",
    "body": "It a dragon",
    "tagList": ["dragons", "training"],
    "createdAt": "2016-02-18T03:22:56.637Z",
    "updatedAt": "2016-02-18T03:48:35.824Z",
    "favorited": false,
    "favoritesCount": 0,
    "author": {
      "username": "jake",
      "bio": "I work at statefarm",
      "image": "https://i.stack.imgur.com/xHWG8.jpg",
      "following": false
    }
  }],
  "articlesCount": 2
}
```

### Single Comment

```JSON
{
  "comment": {
    "id": 1,
    "createdAt": "2016-02-18T03:22:56.637Z",
    "updatedAt": "2016-02-18T03:22:56.637Z",
    "body": "It takes a Jacobian",
    "author": {
      "username": "jake",
      "bio": "I work at statefarm",
      "image": "https://i.stack.imgur.com/xHWG8.jpg",
      "following": false
    }
  }
}
```

### Multiple Comments

```JSON
{
  "comments": [{
    "id": 1,
    "createdAt": "2016-02-18T03:22:56.637Z",
    "updatedAt": "2016-02-18T03:22:56.637Z",
    "body": "It takes a Jacobian",
    "author": {
      "username": "jake",
      "bio": "I work at statefarm",
      "image": "https://i.stack.imgur.com/xHWG8.jpg",
      "following": false
    }
  }]
}
```

### List of Tags

```JSON
{
  "tags": [
    "reactjs",
    "angularjs"
  ]
}
```

## Endpoints:

### Authentication:

`POST /api/users/login`

Example request body:
```JSON
{
  "email": "jake@jake.jake",
  "password": "jakejake"
}
```

No authentication required, returns a [User](#users-for-authentication)

Required fields: `email`, `password`


### Registration:

`POST /api/users`

Example request body:
```JSON
{
  "user":{
    "username": "Jacob",
    "email": "jake@jake.jake",
    "password": "jakejake"
  }
}
```

No authentication required, returns a [User](#users-for-authentication)

Required fields: `email`, `username`, `password`



### Get Current User

`GET /api/user`

Authentication required, returns a [User](#users-for-authentication) that's the current user



### Update User

`PUT /api/user`

Example request body:
```JSON
{
  "user":{
    "email": "jake@jake.jake",
    "bio": "I like to skateboard",
    "image": "https://i.stack.imgur.com/xHWG8.jpg"
  }
}
```

Authentication required, returns the [User](#users-for-authentication)


Accepted fields: `email`, `username`, `password`, `image`, `bio`



### Get Profile

`GET /api/profiles/:username`

Authentication optional, returns a [Profile](#profile)



### Follow user

`POST /api/profiles/:username/follow`

Authentication required, returns a [Profile](#profile)

No additional parameters required



### Unfollow user

`DELETE /api/profiles/:username/follow`

Authentication required, returns a [Profile](#profile)

No additional parameters required



### List Articles

`GET /api/articles`

Returns most recent articles globally by default, provide `tag`, `author` or `favorited` query parameter to filter results

Query Parameters:

Filter by tag:

`?tag=AngularJS`

Filter by author:

`?author=jake`

Favorited by user:

`?favorited=jake`

Limit number of articles (default is 20):

`?limit=20`

Offset/skip number of articles (default is 0):

`?offset=0`

Authentication optional, will return [multiple articles](#multiple-articles), ordered by most recent first


### Get Article

`GET /api/articles/:slug`

No authentication required, will return [single article](#single-article)

### Create Article

`POST /api/articles`

Example request body:

```JSON
{
  "article": {
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "You have to believe",
    "tagList": ["reactjs", "angularjs", "dragons"]
  }
}
```

Authentication required, will return an [Article](#single-article)

Required fields: `title`, `description`, `body`

Optional fields: `tagList` as an array of Strings



### Update Article

`PUT /api/articles/:slug`

Example request body:

```JSON
{
  "article": {
    "title": "Did you train your dragon?"
  }
}
```

Authentication required, returns the updated [Article](#single-article)

Optional fields: `title`, `description`, `body`

The `slug` also gets updated when the `title` is changed


### Delete Article

`DELETE /api/articles/:slug`

Authentication required



### Add Comments to an Article

`POST /api/articles/:slug/comments`

Example request body:

```JSON
{
  "comment": {
    "body": "His name was my name too."
  }
}
```

Authentication required, returns the created [Comment](#single-comment)

Required field: `body`



### Get Comments from an Article

`GET /api/articles/:slug/comments`

Authentication optional, returns [multiple comments](#multiple-comments)



### Delete Comment

`DELETE /api/articles/:slug/comments/:id`

Authentication required



### Favorite Article

`POST /api/articles/:slug/favorite`

Authentication required, returns the [Article](#single-article)

No additional parameters required



### Unfavorite Article

`DELETE /api/articles/:slug/favorite`

Authentication required, returns the [Article](#single-article)

No additional parameters required



### Get Tags

`GET /api/tags`

No authentication required, returns a [List of Tags](#list-of-tags)
