const mongoose = require('mongoose')
const { Schema } = mongoose

const PostComment = new Schema(
  {
    post: { type: String, ref: 'Post', required: true },
    user: { type: String, ref: 'User', required: true },
    comment: { type: String, required: true },
    deleted: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false },
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

module.exports = mongoose.model('PostComment', PostComment)
