const express = require('express')
const router = express.Router()
const {
  getAuthUser,
  sendError,
  sendSuccess,
  print
} = require('../utils/helpers')
const { User, Class, Section, Subscription } = require('../utils/models')

router.get('/', async (req, res, next) => {
  return res.send({
    error: false,
    result: await getAuthUser(req.headers)
  })
})

router.get('/id/:id', async (req, res, next) => {
  try {
    const userById = await User.findById(req.params.id)
    if (userById == null) {
      return sendError('User not found', res)
    }
    return sendSuccess(userById, res)
  } catch (error) {
    return sendError(error, res)
  }
})

router.get('/username/:username', async (req, res, next) => {
  try {
    const userByUsername = await User.findOne({
      username: req.params.username
    }).populate({
      path: 'class',
      populate: { path: 'university' }
    })

    if (userByUsername == null) {
      return sendError('User not found', res)
    }

    return sendSuccess(userByUsername, res)
  } catch (error) {
    return sendError(error, res)
  }
})

router.put('/create', async (req, res, next) => {
  let errors = []
  if (!req.body.image) errors.push('Image is empty')
  if (!req.body.username) errors.push('Username is empty')
  if (!req.body.name) errors.push('Name is empty')
  if (!req.body.sex) errors.push('Sex is empty')
  if (!req.body.dob) errors.push('Date of birth is empty')
  if (!req.body.section) errors.push('Section not provided')
  if (errors.length > 0) return sendError(errors, res)

  print(req.body)

  try {
    const user = await getAuthUser(req.headers)
    const selectedSection = await Section.findById(req.body.section)
    print(`Section :${selectedSection}`)
    const selectedClass = await Class.findById(selectedSection.class)
    // print(selectedClass)
    if (selectedClass == null) {
      return sendError('Class not found', res)
    }
    await User.findByIdAndUpdate(user.id, {
      image: req.body.image,
      username: req.body.username,
      name: req.body.name,
      sex: req.body.sex,
      dob: req.body.dob,
      class: selectedClass.id,
      section: selectedSection.id,
      profileCreated: true
    })
    return sendSuccess(await getAuthUser(req.headers), res)
  } catch (error) {
    return sendError(error, res)
  }
})

/* Sections */

router.post('/section/:class', async (req, res, next) => {
  try {
    const currentUser = await getAuthUser(req.headers)
    const classInfo = await Class.findById(req.params.class)
    if (classInfo == null) {
      return sendError('Class not found', res)
    }
    const currentSection = await Section.findOne({
      class: classInfo.id,
      number: req.body.number
    })

    if (currentSection != null) {
      if (currentSection.deleted) {
        try {
          await Section.findByIdAndUpdate(currentSection.id, {
            deleted: false
          })
          return sendSuccess(await Section.findById(currentSection.id), res)
        } catch (error) {
          return sendError(error.message, res)
        }
      }

      return sendError(
        `Section with number ${req.body.number} exists in ${classInfo.name}`,
        res
      )
    }

    const newSection = await Section.create({
      name: req.body.number,
      number: req.body.number,
      class: classInfo.id,
      createdBy: currentUser.id,
      updated: Date.now(),
      created: Date.now()
    })
    return sendSuccess(newSection, res)
  } catch (error) {
    return sendError(error.message, res)
  }
})

/* Subscriptions */

router.get('/subscriptions', async (req, res, next) => {
  try {
    let startsAt = Date.now()
    if (req.query.startsAt) {
      startsAt = Number.parseInt(req.query.startsAt)
    }
    const page = Number.parseInt(req.query.page)
    const currentUser = await getAuthUser(req.headers)
    return sendSuccess(
      await Subscription.find({ subscriber: currentUser.id, deleted: false })
        .populate({
          path: 'subscriber',
          populate: { path: 'class', populate: { path: 'university' } }
        })
        .populate({ path: 'class', populate: { path: 'university' } })
        .populate('section')
        .sort({ updated: -1 })
        .limit(99)
        .skip(page * 99),
      res
    )
  } catch (error) {
    return sendError(error, res)
  }
})

router.get('/subscriptions/:section', async (req, res, next) => {
  try {
    const currentUser = await getAuthUser(req.headers)
    const alreadySubscripedSubscription = await Subscription.findOne({
      subscriber: currentUser.id,
      section: req.params.section,
      deleted: false
    })

    return sendSuccess(alreadySubscripedSubscription != null, res)
  } catch (error) {
    return sendError(error, res)
  }
})

router.post('/unsubscribe/:class', async (req, res, next) => {
  try {
    const currentUser = await getAuthUser(req.headers)
    const unSubscribedClass = await Class.findById(req.params.class)
    if (unSubscribedClass === null) {
      return sendError('Class not found', res)
    }
    if (currentUser.class.id == unSubscribedClass.id) {
      return sendError("You can't unsubscribe current class", res)
    }
    await Subscription.update(
      {
        subscriber: currentUser.id,
        class: req.params.class
      },
      {
        deleted: true
      },
      { multi: true }
    )
    return sendSuccess(
      'Unsubscribed from all sections of the selected class',
      res
    )
  } catch (error) {
    return sendError(error, res)
  }
})

router.get('/subscribe/:class', async (req, res, next) => {
  try {
    const currentUser = await getAuthUser(req.headers)
    const currentClass = await Class.findById(req.params.class)

    const currentSubscription = await Subscription.findOne({
      subscriber: currentUser.id,
      class: currentClass.id,
      deleted: false
    })
    if (currentSubscription != null) {
      await User.findByIdAndUpdate(currentUser.id, {
        class: currentSubscription.class,
        section: currentSubscription.section,
        updated: Date.now()
      })
    }

    return sendSuccess(await getAuthUser(req.headers), res)
  } catch (error) {
    return sendSuccess(await getAuthUser(req.headers), res)
  }
})

router.post('/subscriptions', async (req, res, next) => {
  try {
    if (!req.body.section) {
      return sendError('Section not provided', res)
    }

    const currentUser = await getAuthUser(req.headers)
    const subscriptionSection = await Section.findById(req.body.section)

    if (subscriptionSection == null) {
      return sendError('Section not found', res)
    }

    try {
      const alreadySubscripedSubscription = await Subscription.findOne({
        subscriber: currentUser.id,
        section: subscriptionSection.id
      })

      await Subscription.update(
        {
          subscriber: currentUser.id,
          class: subscriptionSection.class
        },
        {
          deleted: true
        },
        { multi: true }
      )

      if (alreadySubscripedSubscription != null) {
        await Subscription.findByIdAndUpdate(alreadySubscripedSubscription, {
          deleted: alreadySubscripedSubscription.deleted
        })
      }

      print(`Current Subscription: ${alreadySubscripedSubscription}`)

      if (alreadySubscripedSubscription != null) {
        await Subscription.findByIdAndUpdate(alreadySubscripedSubscription.id, {
          class: subscriptionSection.class,
          deleted: !alreadySubscripedSubscription.deleted,
          updated: Date.now()
        })

        return sendSuccess(
          await Subscription.findOne({
            subscriber: currentUser.id,
            section: subscriptionSection.id
          })
            .populate({
              path: 'subscriber',
              populate: { path: 'class', populate: { path: 'university' } }
            })
            .populate({ path: 'class', populate: { path: 'university' } })
            .populate('section'),
          res
        )
      } else {
        const newSubscription = await Subscription.create({
          subscriber: currentUser.id,
          class: subscriptionSection.class,
          section: subscriptionSection.id,
          updated: Date.now(),
          created: Date.now()
        })

        return sendSuccess(
          await Subscription.findById(newSubscription.id)
            .populate({
              path: 'subscriber',
              populate: { path: 'class', populate: { path: 'university' } }
            })
            .populate({ path: 'class', populate: { path: 'university' } })
            .populate('section'),
          res
        )
      }
    } catch (error) {
      return sendError(error, res)
    }
  } catch (error) {
    return sendError(error, res)
  }
})

router.delete('/subscriptions/:subscription', async (req, res, next) => {
  try {
    const deleteSubscription = await Subscription.findByIdAndUpdate(
      req.params.subscription,
      {
        deleted: true,
        updated: Date.now()
      }
    )
    return sendSuccess(deleteSubscription, res)
  } catch (error) {
    return sendError(error, res)
  }
})

/* End Subscriptions */

module.exports = router
