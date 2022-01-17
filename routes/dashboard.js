const express = require('express')
const router = express.Router()
const passport = require('passport')
const { print } = require('../utils/helpers')
const Account = require('../models/account')

const { University, Class, Section } = require('../utils/models')

const siteData = {
  title: 'ClassRoots',
  pages: {
    index: 'Home',
    login: 'Please login to continue'
  }
}

const loggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next()
  } else {
    return res.redirect('/dashboard/login')
  }
}

const checkIfloggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard')
  } else {
    next()
  }
}

router.get('/', loggedIn, (req, res, next) => {
  return res.render('index', {
    title: 'Dashboard'
  })
})

router.get('/login', (req, res) => {
  return res.render('login', {
    title: siteData.title,
    page: siteData.pages.login
  })
})

router.post(
  '/login',
  passport.authenticate('local', {
    failureMessage: print
  }),
  (req, res) => {
    return res.redirect('/dashboard')
  }
)

router.get('/register', loggedIn, function(req, res) {
  return res.render('login', {
    title: siteData.title
  })
})

router.post('/register', loggedIn, function(req, res) {
  const email = req.body.username
  const password = req.body.password

  Account.register(
    new Account({ username: email }),
    password,
    (err, account) => {
      if (err) {
        return res.json({ error: err.message })
      }

      print(account)
      return res.redirect('/dashboard')
    }
  )
})

router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/dashboard')
})

router.get('/universities', loggedIn, async (req, res) => {
  try {
    return res.render('universities', {
      title: 'Universities',
      universities: await University.find({}).populate('createdBy'),
      university: null
    })
  } catch (error) {
    return res.send(error)
  }
})

router.get('/universities/delete/:id', loggedIn, async (req, res) => {
  try {
    const universityToDelete = await University.findById(req.params.id)

    await University.findOneAndUpdate(req.params.id, {
      deleted: !universityToDelete.deleted
    })
    await Class.updateMany(
      { university: req.params.id },
      { deleted: !universityToDelete.deleted }
    )

    return res.redirect('/dashboard/universities')
  } catch (error) {
    return res.send(error)
  }
})

router.post('/universities', loggedIn, async (req, res) => {
  try {
    const body = req.body
    body.code = body.code.toLowerCase()
    body.createdBy = req.user._id
    body.updated = Date.now()
    body.created = Date.now()
    const newUniversity = University(body)
    await newUniversity.save()
    return res.redirect('/dashboard/universities')
  } catch (error) {
    return res.send(error)
  }
})

router.get('/universities/update/:id', loggedIn, async (req, res) => {
  try {
    return res.render('universities', {
      title: 'Universities',
      universities: await University.find({}).populate('createdBy'),
      university: await University.findById(req.params.id)
    })
  } catch (error) {
    return res.send(error)
  }
})

router.post('/universities/update/:id', loggedIn, async (req, res) => {
  try {
    const body = req.body
    body.code = body.code.toLowerCase()
    body.updated = Date.now()
    await University.findByIdAndUpdate(req.params.id, body)

    return res.redirect('/dashboard/universities')
  } catch (error) {
    return res.send(error)
  }
})

router.get('/classes', loggedIn, async (req, res) => {
  try {
    return res.render('classes', {
      title: 'Classes',
      classes: await Class.find({})
        .populate('university')
        .populate('createdBy'),
      universities: await University.find({}).populate('createdBy'),
      selectedClass: null
    })
  } catch (error) {
    return res.send(error)
  }
})

router.get('/classes/update/:id', loggedIn, async (req, res) => {
  try {
    return res.render('classes', {
      title: 'Classes',
      classes: await Class.find({})
        .populate('university')
        .populate('createdBy'),
      universities: await University.find({}).populate('createdBy'),
      selectedClass: await Class.findById(req.params.id)
    })
  } catch (error) {
    return res.send(error)
  }
})

router.post('/classes/update/:id', loggedIn, async (req, res) => {
  try {
    const body = req.body
    body.code = body.code.toLowerCase()
    body.updated = Date.now()
    const newClass = Class(body)
    await Class.findByIdAndUpdate(req.params.id, body)
    return res.redirect('/dashboard/classes')
  } catch (error) {
    return res.send(error)
  }
})

router.get('/classes/delete/:id', loggedIn, async (req, res) => {
  try {
    const classToDelete = await Class.findById(req.params.id)

    await Class.findByIdAndUpdate(req.params.id, {
      deleted: !classToDelete.deleted
    })

    return res.redirect('/dashboard/classes')
  } catch (error) {
    return res.send(error)
  }
})

router.post('/classes', loggedIn, async (req, res) => {
  try {
    const body = req.body
    body.code = body.code.toLowerCase()
    body.createdBy = req.user._id
    body.updated = Date.now()
    body.created = Date.now()
    const newClass = Class(body)
    await newClass.save()
    return res.redirect('/dashboard/classes')
  } catch (error) {
    return res.send(error)
  }
})

router.get('/classes/sections/:class', loggedIn, async (req, res) => {
  try {
    const classInfo = await Class.findById(req.params.class)
    return res.render('sections', {
      title: `${classInfo.name} Sections`,
      sections: await Section.find({ class: classInfo.id }),
      selectedSection: null
    })
  } catch (error) {
    return res.send(error)
  }
})

router.get('/classes/sections/delete/:section', async (req, res) => {
  try {
    const currentSection = await Section.findById(req.params.section)

    await Section.findByIdAndUpdate(currentSection.id, {
      deleted: !currentSection.deleted,
      updated: Date.now()
    })

    return res.redirect(`/dashboard/classes/sections/${currentSection.class}`)
  } catch (error) {
    return res.send(error)
  }
})

router.post('/classes/sections/update/:section', async (req, res) => {
  try {
    const currentSection = await Section.findById(req.params.section)
    if (currentSection.number != req.body.number) {
      const section = await Section.findOne({
        class: currentSection.class,
        number: req.body.number
      })

      if (section != null) {
        return res.send(
          `Section with number ${req.body.number} exists in parent class`
        )
      }
    }

    await Section.findByIdAndUpdate(currentSection.id, {
      name: req.body.name,
      number: req.body.number,
      deleted: false,
      updated: Date.now()
    })

    return res.redirect(`/dashboard/classes/sections/${currentSection.class}`)
  } catch (error) {
    return res.send(error)
  }
})

router.post('/classes/sections/:class', loggedIn, async (req, res) => {
  try {
    const classInfo = await Class.findById(req.params.class)
    const currentSection = await Section.findOne({
      class: classInfo.id,
      number: req.body.number
    })

    if (currentSection != null) {
      return res.send(
        `Section with number ${req.body.number} exists in ${classInfo.name}`
      )
    }
    await Section.create({
      name: req.body.name,
      number: req.body.number,
      class: classInfo.id,
      updated: Date.now(),
      created: Date.now()
    })
    return res.render('sections', {
      title: `${classInfo.name} Sections`,
      sections: await Section.find({ class: classInfo.id }),
      selectedSection: null
    })
  } catch (error) {
    return res.send(error)
  }
})

module.exports = router
