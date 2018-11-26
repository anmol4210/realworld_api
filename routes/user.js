const route = require('express').Router();

const {
  User,
  UserDetails
} = require('../db/index');
const {
  encryptPassword
} = require('../services/bcrypt');
const {
  generateToken,
  getIdFromToken
} = require('../services/jwt');
const {
  generateUUID
} = require('../services/uuidService');
const {
  validateUsername,
  validatePassword,
  validateEmail,
  ensureTokenInHeader
} = require('../middlewares');
const passport = require('../auth');

route.post('/users', validateUsername, validatePassword, validateEmail, async (req, res) => {

  const userId = await generateUUID();
  const hashedPassword = encryptPassword(req.body.user.password);

  try {

    const newUserDetails = await UserDetails.create({
      user_id: userId,
      email: req.body.user.email,
      username: req.body.user.username
    })

    const newUser = await User.create({
      password: hashedPassword,
      user_id: userId,
    })

    const token = generateToken(userId);

    res.status(201).json({
      user: {
        token: token,
        email: newUserDetails.email,
        username: newUserDetails.username,
        bio: null,
        image: null
      }
    })
  } catch (err) {
    res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }

})

route.post('/users/login',
  passport.authenticate('local', {
    successRedirect: '../user',
    failureRedirect: '../error',
    failureFlash: true
  })
);

route.get('/user', (req, res) => {

  let user_id, email;

  if (req.user) {
    user_id = req.user.dataValues.user_id;
    email = req.user.dataValues.email
    req.session.destroy()
  } else {
    const decryptedToken = getIdFromToken(req.headers.token);
    if (decryptedToken.error) {
      return res.status(401).json({
        errors: {
          message: "Invalid Token"
        }
      })
    } else {
      user_id = decryptedToken.id;
    }
  }

  try {
    UserDetails.findByPk(user_id).then((userDetail) => {

      const token = generateToken(user_id);

      return res.status(200).json({
        user: {
          token,
          email: userDetail.email,
          username: userDetail.username,
          bio: userDetail.bio,
          image: userDetail.image
        }
      })
    })
  } catch (err) {
    return res.status(500).json({
      errors: {
        message: "Something went wrong"
      }
    })
  }
})

route.get('/error', (req, res) => {
  res.status(422).json({
    errors: req.flash().error
  });
})

route.put('/user', ensureTokenInHeader, validateUsername, validatePassword, async (req, res) => {

  const decryptedToken = getIdFromToken(req.headers.token);
  if (decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: "Invalid Token"
      }
    })
  } else {
    const userDetail = await UserDetails.findByPk(decryptedToken.id);

    const user = await User.findOne({
      where: {
        user_id: userDetail.user_id
      }
    })

    if (req.body.user.email) {
      userDetail.email = req.body.user.email
    }
    if (req.body.user.password) {
      user.password = encryptPassword(req.body.user.password)
    }
    if (req.body.user.username) {
      userDetail.username = req.body.user.username
    }
    if (req.body.user.bio) {
      userDetail.bio = req.body.user.bio
    }
    if (req.body.user.image) {
      userDetail.image = req.body.user.image
    }

    try {
      const updatedUser = await user.save();
      const updatedUserDetails = await userDetail.save();

      return res.status(200).json({
        user: {
          email: updatedUserDetails.email,
          token: req.headers.token,
          username: updatedUserDetails.username,
          bio: updatedUserDetails.bio,
          image: updatedUserDetails.image
        }
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

module.exports = route;
