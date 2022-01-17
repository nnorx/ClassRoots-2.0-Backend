const express = require('express')
require('express-router-group')
const router = express.Router()

const passport = new require('passport')
const keys = new require('../config/keys')
require('../config/passport')(passport)
const jsonWebToken = require('jsonwebtoken')

const {
  User,
  University,
  Class,
  Section,
  Subscription
} = require('../utils/models')
const { sendError, sendSuccess, print } = require('../utils/helpers')

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
    })

    return user
  } catch (error) {
    return null
  }
}

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const user = await getAuthUser(req.headers)
    return user == null
      ? sendError('User not found', res.status(401))
      : sendSuccess(user, res)
  }
)

router.post('/login', async (req, res) => {
  let errors = []
  if (!req.body.email) {
    errors.push('Email not provided')
  }
  if (!req.body.password) {
    errors.push('Password not provided')
  }
  if (!req.body.fcmToken) {
    errors.push('FCM Token not provided')
  }
  if (errors.length > 0) {
    return sendError(errors, res)
  }

  const newUser = User({
    email: req.body.email,
    password: req.body.password,
    fcmToken: req.body.fcmToken,
    lastLoggedIn: Date.now(),
    created: Date.now()
  })

  try {
    await newUser.save()
    const token = jsonWebToken.sign(newUser.toJSON(), keys.secret)
    const userCreated = await User.findOne({
      email: req.body.email
    }).populate({
      path: 'class',
      populate: { path: 'university' }
    })
    return sendSuccess({ token: 'JWT ' + token, user: userCreated }, res)
  } catch (error) {
    try {
      const currentUser = await User.findOne({
        email: req.body.email
      }).populate({
        path: 'class',
        populate: { path: 'university' }
      })
      if (currentUser == null) {
        return sendError('No account corresponding to the email provided', res)
      }
      currentUser.comparePassword(req.body.password, async (err, isMatch) => {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          const token = jsonWebToken.sign(currentUser.toJSON(), keys.secret)
          await User.findByIdAndUpdate(currentUser.id, {
            fcmToken: req.body.fcmToken,
            lastLoggedIn: Date.now()
          })

          return sendSuccess({ token: 'JWT ' + token, user: currentUser }, res)
        } else {
          return sendError('Wrong password provided', res.status(401))
        }
      })
    } catch (error) {
      return sendError(error, res)
    }
  }
})

router.get('/universities', async (req, res) => {
  try {
    return sendSuccess(await University.find({}), res)
  } catch (error) {
    return sendError(error, res)
  }
})

router.get('/classes/:university', async (req, res) => {
  try {
    return sendSuccess(
      await Class.find({
        university: req.params.university,
        deleted: false
      }).populate('university'),
      res
    )
  } catch (error) {
    return sendError(error, res)
  }
})

router.get(
  '/classes/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const currentUser = await getAuthUser(req.headers)
      if (!currentUser.profileCreated) {
        return sendSuccess('Create profile first', res)
      }
      const subscribedClassesList = []
      const currentSubscribedClasses = await Subscription.find({
        subscriber: currentUser.id,
        deleted: false
      })
        .populate({
          path: 'section',
          select: 'class -_id'
        })
        .select('section -_id')

      currentSubscribedClasses.forEach(subscription => {
        subscribedClassesList.push(subscription.section.class)
      })

      // print(subscribedClassesList)

      // return res.send(currentSubscribedClasses)

      return sendSuccess(
        await Class.find({
          _id: subscribedClassesList
        }).populate('university'),
        res
      )
    } catch (error) {
      return sendError(error, res)
    }
  }
)

router.get('/sections/:class', async (req, res) => {
  try {
    return sendSuccess(
      await Section.find({
        class: req.params.class,
        deleted: false
      }).sort({ number: 1 }),
      res
    )
  } catch (error) {
    return sendError(error, res)
  }
})

router.group(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  router => router.use(require('./profile'))
)

router.group(
  '/posts',
  passport.authenticate('jwt', { session: false }),
  router => {
    router.use(require('./posts'))
  }
)

module.exports = router
