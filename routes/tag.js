const route = require('express').Router();
const {
  Tags
} = require('../db/index');

route.get('/', async (req, res) => {
  try {
    const tags = (await Tags.findAll()).map(tag => {
      return tag.tagName
    });

    return res.status(200).json({
      tags
    })
  } catch (err) {
    return res.status(500).json({
      error: {
        message: err.message
      }
    })
  }
})

module.exports = route;
