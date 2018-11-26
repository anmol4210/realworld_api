const validateUsername = (req, res, next) => {
  if (req.headers.token) {
    if (req.body.user.username != undefined) {
      if (req.body.user.username.length == 0) {
        return res.status(400).json({
          errors: {
            username: ["Username must have single character"]
          }
        })
      }
    }
  } else {
    if (!req.body.user.username) {
      return res.status(400).json({
        errors: {
          username: ["Username is required"]
        }
      })
    } else if (req.body.user.username.length < 4) {
      return res.status(400).json({
        errors: {
          username: ["Username must have 4 characters"]
        }
      })
    }
  }
  next();
}

const validatePassword = (req, res, next) => {
  if (req.headers.token) {
    if (req.body.user.password != undefined && req.body.user.password.length < 6) {
      return res.status(400).json({
        errors: {
          password: ["Password is too short"]
        }
      })
    }
  } else {
    if (req.body.user.password == undefined) {
      return res.status(400).json({
        errors: {
          password: ["Password is required"]
        }
      })
    } else if (req.body.user.password.length < 6) {
      return res.status(400).json({
        errors: {
          password: ["Password is too short"]
        }
      })
    }
  }
  next();
}

const validateEmail = (req, res, next) => {
  if (!req.body.user.email) {
    return res.status(400).json({
      errors: {
        email: ["Email can not be empty"]
      }
    })
  }
  next();
}

const ensureTokenInHeader = (req, res, next) => {
  if (!req.headers.token) {
    return res.status(401).json({
      errors: {
        message: 'Unauthorized Access. Token is absent in headers'
      }
    })
  }

  next();
}

module.exports = {
  validateUsername,
  validatePassword,
  validateEmail,
  ensureTokenInHeader
}
