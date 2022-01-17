const mongoose = require('mongoose')
const { Schema } = mongoose

const University = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      unique: true,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },
    createdBy: {
      type: String,
      ref: 'Account',
      required: true
    },
    deleted: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model('University', University)
