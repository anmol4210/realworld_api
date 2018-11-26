const slug = require('slug');

function uniqueString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function createSlug(str) {
  return slug(str, '_') + "_" + uniqueString();
}

module.exports = {
  createSlug
}
