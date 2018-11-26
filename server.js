const express = require('express');
const expressSession = require('express-session');
const flash = require('connect-flash');

const passport = require('./auth');
const config = require('./config');

const app = express();

app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

app.use(expressSession({
  secret: config.sessionSecret,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/api', require('./routes/user'))
app.use('/api/profiles', require('./routes/profile'));
app.use('/api/articles', require('./routes/article'));
app.use('/api/tags', require('./routes/tag'));

app.listen(8080, () => {
  console.log('Server started on http://localhost:8080')
})
