const mongoose = require('mongoose')
const { Schema } = mongoose

const Subscription = new Schema(
  {
    subscriber: { type: String, ref: 'User', required: true },
    class: { type: String, ref: 'Class', required: true },
    section: { type: String, ref: 'Section', required: true },
    blocked: { type: Boolean, default: false, required: true },
    deleted: { type: Boolean, default: false, required: true },
    updated: { type: Number, required: true },
    created: { type: Number, required: true }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Subscription', Subscription)
