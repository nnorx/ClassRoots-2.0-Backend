const { model, Schema } = require('mongoose')

const Section = Schema(
  {
    name: String,
    number: { type: Number, required: true },
    class: { type: String, ref: 'Class', required: true },
    deleted: { type: Boolean, default: false, required: true },
    createdBy: {type: String, ref: 'User'},
    updated: { type: Number, required: true },
    created: { type: Number, required: true }
  },
  { timestamps: true }
)

module.exports = model('Section', Section)
