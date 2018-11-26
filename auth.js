const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const {
  User,
  UserDetails
} = require('./db/index');
const {
  isPasswordValid
} = require('./services/bcrypt');

passport.serializeUser(function(userDetails, done) {
  done(null, userDetails.user_id)
});

passport.deserializeUser(function(userKey, done) {
  UserDetails.findByPk(userKey).then((userDetails) => {
    done(null, userDetails)
  }).catch((err) => {
    done(err)
  })
});

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    UserDetails.findOne({
      where: {
        email: email
      }
    }).then(userDetails => {
      if (!userDetails) {
        return done(null, false, {
          message: 'User does not exists.'
        });
      }

      User.findOne({
        where: {
          user_id: userDetails.user_id
        }
      }).then(user => {
        if (!isPasswordValid(password, user.dataValues.password)) {
          return done(null, false, {
            message: 'Incorrect password'
          })
        }

        return done(null, userDetails);
      })

    }).catch((err) => {
      console.log(err)
      done(err)
    })
  }
));

module.exports = passport;
