const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const { Schema } = mongoose

const User = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, unique: true },
    name: { type: String },
    sex: { type: Number },
    dob: { type: Number },
    image: { type: String },
    class: { type: String, ref: 'Class' },
    section: { type: String, ref: 'Section' },
    postCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followers: [{ type: String }],
    fcmToken: { type: String, required: true },
    verified: { type: Boolean, default: false, required: true },
    profileCreated: { type: Boolean, default: false, required: true },
    role: { type: Number, default: 1, required: true },
    disabled: { type: Boolean, default: false, required: true },
    blocked: { type: Boolean, default: false, required: true },
    deleted: { type: Boolean, default: false, required: true },
    lastLoggedIn: { type: Number, required: true },
    created: { type: Number, required: true }
  },
  { timestamps: true }
)

User.pre('save', function(next) {
  const user = this
  if (!this.usernameCreated) {
    user.username = this._id + Date.now() + this._id
  }
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        return next(err)
      }
      bcrypt.hash(user.password, salt, null, function(err, hash) {
        if (err) {
          return next(err)
        }
        user.password = hash
        next()
      })
    })
  } else {
    return next()
  }
})

User.methods.comparePassword = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    if (err) {
      return cb(err)
    }
    cb(null, isMatch)
  })
}

module.exports = mongoose.model('User', User)
