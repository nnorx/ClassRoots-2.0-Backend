const mongoose = require('mongoose')
const { Schema } = mongoose

const PostLike = new Schema(
  {
    post: {
      type: String,
      ref: 'Post',
      required: true
    },
    user: {
      type: String,
      ref: 'User',
      required: true
    },
    liked: {
      type: Boolean,
      default: true,
      required: true
    },
    updated: {
      type: Number,
      required: true
    },
    created: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('PostLike', PostLike)
