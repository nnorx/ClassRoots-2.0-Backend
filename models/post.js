const mongoose = require('mongoose')
const { Schema } = mongoose
const findHashTags = require('find-hashtags')

const Post = new Schema(
  {
    author: { type: String, ref: 'User', required: true },
    description: { type: String, required: true },
    class: { type: String, ref: 'Class', required: true },
    section: { type: String, ref: 'Section', required: true },
    images: [String],
    tags: [String],
    likes: [{ type: String, ref: 'PostLike' }],
    likeCount: { type: Number, default: 0, required: true },
    commentCount: { type: Number, default: 0, required: true },
    shareCount: { type: Number, default: 0, required: true },
    blocked: { type: Boolean, default: false, required: true },
    deleted: { type: Boolean, default: false, required: true },
    updated: { type: Number, required: true },
    created: { type: Number, required: true }
  },
  { timestamps: true }
)

Post.pre('save', function(next) {
  this.description = this.description.substring(0, 280)
  this.tags = findHashTags(this.description)
  next()
})

module.exports = mongoose.model('Post', Post)
