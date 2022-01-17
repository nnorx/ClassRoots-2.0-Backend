const jsonWebToken = require('jsonwebtoken')
const { User } = require('../utils/models')
const admin = require('firebase-admin')

const sendNotification = async (token, title, body) =>
  await admin.messaging().send({
    token: token,
    notification: {
      title: title,
      body: body
    }
  })

const sendSuccess = (message, res) =>
  res.send({ error: false, result: message })

const sendError = (error, res) => res.send({ error: true, result: error })

const getToken = headers => {
  if (headers && headers.authorization) {
    const parted = headers.authorization.split(' ')
    return parted.length === 2 ? parted[1] : null
  } else {
    return null
  }
}

const getAuthUser = async headers => {
  try {
    const user = await User.findOne({
      email: jsonWebToken.decode(getToken(headers)).email
    }).populate({ path: 'class', populate: { path: 'university' } })

    return user
  } catch (error) {
    return null
  }
}

module.exports = {
  sendSuccess: sendSuccess,
  sendError: sendError,
  getAuthUser: getAuthUser,
  print: console.log,
  sendNotification: sendNotification
}
