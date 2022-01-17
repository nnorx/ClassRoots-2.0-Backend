const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const logger = require('morgan')
const mongoose = require('mongoose')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const Account = require('./models/account')
const config = require('./config/keys')
const admin = require('firebase-admin')
admin.initializeApp({
  credential: admin.credential.cert(require('./config/keys').firebase),
  databaseURL: require('./config/keys').firestoreDbUrl
})

const dashboardRouter = require('./routes/dashboard')
const apiRouter = require('./routes/api')

const app = express()

mongoose.connect(require('./config/keys').mongoURI, {
  useNewUrlParser: true
})
mongoose.set('useCreateIndex', true)

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', async () => {
  console.log('connected')

  try {
    const accountCount = await Account.countDocuments()
    if (accountCount === 0) {
      await Account.register(
        new Account({ username: config.adminEmail }),
        config.adminPassword,
        (err, account) => {
          if (err) {
            return res.json({ error: err.message })
          }

          print(account)
        }
      )
    }
  } catch (error) {
    console.log(error)
  }
})

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(
  require('express-session')({
    secret: config.secret,
    resave: false,
    saveUninitialized: false
  })
)
app.use(passport.initialize())
app.use(passport.session())

app.use('/api', apiRouter)
app.use('/dashboard', dashboardRouter)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'))
  const path = require('path')
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
  })
}

// passport config
passport.use(new LocalStrategy(Account.authenticate()))
passport.serializeUser(Account.serializeUser())
passport.deserializeUser(Account.deserializeUser())

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  // render the error page
  res.status(err.status || 500)
  res.render('error', {
    title: err.status ? `Error ${err.status}` : 'Error 500'
  })
})

module.exports = app
