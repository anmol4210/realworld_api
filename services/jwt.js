const jwt = require('jsonwebtoken');
const config = require('../config');

function generateToken(userId) {
  return jwt.sign({
    id: userId
  }, config.secret);
}

function getIdFromToken(token) {
  let id;

  try {
    id = jwt.verify(token, config.secret).id;
  } catch (err) {
    return {
      id: null,
      error: err.message
    }
  }
  return {
    id,
    error: null
  }
}

module.exports = {
  generateToken,
  getIdFromToken
}
