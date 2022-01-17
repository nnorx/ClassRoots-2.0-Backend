const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

// load up the user model
const User = require('../models/user')
const keys = require('./keys') // get db keys file

module.exports = passport => {
  const opts = {}
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('JWT')
  opts.secretOrKey = keys.secret
  passport.use(
    new JwtStrategy(opts, (jwtPayload, callback) => {
      User.findOne({ id: jwtPayload.id })
        .then(user => {
          return callback(null, user)
        })
        .catch(err => {
          return callback(err)
        })
    })
  )
}
