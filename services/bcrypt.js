const bcrypt = require('bcryptjs');

function encryptPassword(password) {
  return bcrypt.hashSync(password, 8);
}

function isPasswordValid(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword)
}

module.exports = {
  encryptPassword,
  isPasswordValid
}
