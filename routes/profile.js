const route = require('express').Router();

const {
  User,
  UserDetails
} = require('../db/index');
const {
  getIdFromToken
} = require('../services/jwt');

route.get('/:username', async (req, res) => {

  let followingUserDetails;

  try {
    followingUserDetails = await UserDetails.findOne({
      where: {
        username: req.params.username
      }
    });

    if (!followingUserDetails) {
      throw {
        message: `User with username ${req.params.username} does not exists`
      }
    }
  } catch (err) {
    return res.status(400).json({
      errors: {
        message: err.message
      }
    })
  }

  if (req.headers.token) {

    const decryptedToken = getIdFromToken(req.headers.token);

    if (decryptedToken.error) {
      return res.status(401).json({
        errors: {
          message: "Invalid Token"
        }
      })
    } else {

      let isFollowing;

      try {

        const followerUser = await UserDetails.findByPrimary(decryptedToken.id);

        const followingUser = await UserDetails.findByPrimary(followingUserDetails.user_id);

        isFollowing = await followingUser.hasFollower(followerUser);

      } catch (err) {
        return res.status(500).json({
          errors: {
            message: err.message
          }
        })
      }

      return res.status(200).json({
        profile: {
          username: followingUserDetails.dataValues.username,
          bio: followingUserDetails.dataValues.bio,
          image: followingUserDetails.dataValues.image,
          following: isFollowing
        }
      })
    }

  } else {
    return res.status(200).json({
      profile: {
        username: followingUserDetails.dataValues.username,
        bio: followingUserDetails.dataValues.bio,
        image: followingUserDetails.dataValues.image,
        following: false
      }
    })
  }

})

route.post('/:username/follow', async (req, res) => {

  if (req.headers.token) {
    let user_id;

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

    try {
      const followerUser = await UserDetails.findByPrimary(user_id);

      const followingUser = await UserDetails.findOne({
        where: {
          username: req.params.username
        }
      });

      followingUser.addFollower(followerUser);

      return res.status(200).json({
        profile: {
          username: followingUser.username,
          bio: followingUser.bio,
          image: followingUser.image,
          following: true
        }
      })
    } catch (err) {
      return res.status(500).json({
        errors: {
          message: "Something went wrong"
        }
      })
    }

  } else {
    return res.status(401).json({
      errors: {
        message: "Unauthorized access not allowed. Token required"
      }
    })
  }
})

route.delete('/:username/follow', async (req, res) => {

  if (req.headers.token) {
    let user_id;

    const decryptedToken = getIdFromToken(req.headers.token);

    if (decryptedToken.error) {
      return res.status(401).json({
        errors: {
          message: ["Invalid Token"]
        }
      })
    } else {
      user_id = decryptedToken.id;
    }

    try {
      const followerUser = await UserDetails.findByPrimary(user_id);

      const followingUser = await UserDetails.findOne({
        where: {
          username: req.params.username
        }
      });

      followingUser.removeFollower(followerUser);

      return res.status(200).json({
        profile: {
          username: followingUser.username,
          bio: followingUser.bio,
          image: followingUser.image,
          following: false
        }
      })
    } catch (err) {
      return res.status(500).json({
        errors: {
          message: "Something went wrong"
        }
      })
    }

  } else {
    return res.status(401).json({
      errors: {
        message: "Unauthorized access not allowed. Token required"
      }
    })
  }
});

module.exports = route;
