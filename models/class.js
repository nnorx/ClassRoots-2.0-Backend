const mongoose = require('mongoose')
const { Schema } = mongoose

const Class = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true, required: true },
    sections: [{ type: String, ref: 'Section', required: true }],
    university: { type: String, ref: 'University', required: true },
    createdBy: { type: String, ref: 'Account', required: true },
    deleted: { type: Boolean, default: false, required: true },
    updated: { type: Number, required: true },
    created: { type: Number, required: true }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Class', Class)
