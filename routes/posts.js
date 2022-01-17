const express = require('express')
const router = express.Router()
const {
  User,
  Post,
  PostLike,
  PostComment,
  Section
} = require('../utils/models')
const {
  sendError,
  sendSuccess,
  getAuthUser,
  print,
  sendNotification
} = require('../utils/helpers')

router.get('/', async (req, res, next) => {
  let startsAt = Date.now()
  if (req.query.startsAt) {
    startsAt = Number.parseInt(req.query.startsAt)
  }
  const page = Number.parseInt(req.query.page)
  const currentUser = await getAuthUser(req.headers)
  const posts = await Post.find({
    created: { $lte: startsAt },
    deleted: false,
    blocked: false
  })
    .sort({ created: -1 })
    .populate({
      path: 'author',
      populate: { path: 'class', populate: { path: 'university' } }
    })
    .populate({
      path: 'likes',
      match: { user: currentUser._id, liked: true }
    })
    .populate({ path: 'class', populate: { path: 'university' } })
    .populate('section')
    .limit(50)
    .skip(page * 50)
  return sendSuccess(posts, res)
})

router.get('/subscribed/class', async (req, res, next) => {
  let startsAt = Date.now()
  if (req.query.startsAt) {
    startsAt = Number.parseInt(req.query.startsAt)
  }
  const page = Number.parseInt(req.query.page)
  const currentUser = await getAuthUser(req.headers)
  const posts = await Post.find({
    class: currentUser.class.id,
    created: { $lte: startsAt },
    deleted: false,
    blocked: false
  })
    .sort({ created: -1 })
    .populate({
      path: 'author',
      populate: { path: 'class', populate: { path: 'university' } }
    })
    .populate({
      path: 'likes',
      match: { user: currentUser._id, liked: true }
    })
    .populate({ path: 'class', populate: { path: 'university' } })
    .populate('section')
    .limit(50)
    .skip(page * 50)
  return sendSuccess(posts, res)
})

router.get('/tagged/:tag', async (req, res, next) => {
  let startsAt = Date.now()
  if (req.query.startsAt) {
    startsAt = Number.parseInt(req.query.startsAt)
  }

  const page = Number.parseInt(req.query.page)
  const currentUser = await getAuthUser(req.headers)
  const posts = await Post.find({
    tags: req.params.tag,
    created: { $lte: startsAt },
    deleted: false,
    blocked: false
  })
    .sort({ created: -1 })
    .populate({
      path: 'author',
      populate: { path: 'class', populate: { path: 'university' } }
    })
    .populate({
      path: 'author',
      populate: { path: 'class', populate: { path: 'university' } }
    })
    .populate({
      path: 'likes',
      match: { user: currentUser._id, liked: true }
    })
    .populate({ path: 'class', populate: { path: 'university' } })
    .populate('section')
    .limit(50)
    .skip(page * 50)
  return sendSuccess(posts, res)
})

router.get('/tagged/:tag/search/:query', async (req, res, next) => {
  let startsAt = Date.now()
  if (req.query.startsAt) {
    startsAt = Number.parseInt(req.query.startsAt)
  }

  const page = Number.parseInt(req.query.page)
  const currentUser = await getAuthUser(req.headers)
  const posts = await Post.find({
    description: { $regex: req.params.query, $options: 'i' },
    tags: req.params.tag,
    created: { $lte: startsAt },
    deleted: false,
    blocked: false
  })
    .sort({ created: -1 })
    .populate({
      path: 'author',
      populate: { path: 'class', populate: { path: 'university' } }
    })
    .populate({
      path: 'likes',
      match: { user: currentUser._id, liked: true }
    })
    .populate({ path: 'class', populate: { path: 'university' } })
    .populate('section')
    .limit(50)
    .skip(page * 50)
  return sendSuccess(posts, res)
})

router.get('/user/:user', async (req, res, next) => {
  let startsAt = Date.now()
  if (req.query.startsAt) {
    startsAt = Number.parseInt(req.query.startsAt)
  }

  const page = Number.parseInt(req.query.page)
  const currentUser = await getAuthUser(req.headers)
  const posts = await Post.find({
    author: req.params.user,
    created: { $lte: startsAt },
    deleted: false,
    blocked: false
  })
    .sort({ created: -1 })
    .populate({
      path: 'author',
      populate: { path: 'class', populate: { path: 'university' } }
    })
    .populate({
      path: 'likes',
      match: { user: currentUser._id, liked: true }
    })
    .populate({ path: 'class', populate: { path: 'university' } })
    .populate('section')
    .limit(50)
    .skip(page * 50)
  return sendSuccess(posts, res)
})

router.get('/search/:query', async (req, res, next) => {
  let startsAt = Date.now()
  if (req.query.startsAt) {
    startsAt = Number.parseInt(req.query.startsAt)
  }

  const page = Number.parseInt(req.query.page)
  const currentUser = await getAuthUser(req.headers)
  const posts = await Post.find({
    description: { $regex: req.params.query, $options: 'i' },
    created: { $lte: startsAt },
    deleted: false,
    blocked: false
  })
    .sort({ created: -1 })
    .populate({
      path: 'author',
      populate: { path: 'class', populate: { path: 'university' } }
    })
    .populate({
      path: 'likes',
      match: { user: currentUser._id, liked: true }
    })
    .populate({ path: 'class', populate: { path: 'university' } })
    .populate('section')
    .limit(50)
    .skip(page * 50)
  return sendSuccess(posts, res)
})

router.post('/create/:section', async (req, res, next) => {
  let errors = []
  if (!req.body.description) {
    errors.push('Description not provided')
  }
  if (errors.length > 0) {
    return sendError(errors, res)
  }
  try {
    const currentUser = await getAuthUser(req.headers)
    if (!currentUser.profileCreated) {
      return sendError('Profile has to be created before creating post', res)
    }
    const postSection = await Section.findById(req.params.section)
    if (postSection == null) {
      return sendError('Section not found', res)
    }

    const newPost = Post({
      author: currentUser._id,
      description: req.body.description,
      class: postSection.class,
      section: postSection.id,
      images: req.body.images,
      updated: Date.now(),
      created: Date.now()
    })
    await newPost.save()
    await User.findByIdAndUpdate(currentUser.id, {
      postCount: await Post.countDocuments({
        author: currentUser.id,
        deleted: false
      })
    })
    return sendSuccess(
      await Post.findById(newPost.id).populate({
        path: 'author',
        populate: { path: 'class', populate: { path: 'university' } }
      }),
      res
    )
  } catch (error) {
    return sendError(error, res)
  }
})

router.delete('/post/:id', async (req, res, next) => {
  try {
    const currentUser = await getAuthUser(req.headers)
    const currentPost = await Post.findById(req.params.id)
    if (currentPost.author != currentUser.id) {
      return next("You can't delete someone else's post")
    }
    await Post.findByIdAndUpdate(req.params.id, { deleted: true })
    await User.findByIdAndUpdate(currentUser.id, {
      postCount: await Post.countDocuments({
        author: currentUser.id,
        deleted: false,
        blocked: false
      }),
      updated: Date.now()
    })
    return sendSuccess('post has been deleted successfully', res)
  } catch (error) {
    return next(error.message)
  }
})

router.get('/like/:post', async (req, res, next) => {
  print(req.params)
  try {
    const currentPost = await Post.findById(req.params.post)
    if (currentPost == null) return sendError('Post not found', res)
    const currentUser = await getAuthUser(req.headers)
    const currentPostLike = await PostLike.findOne({
      post: req.params.post,
      user: currentUser.id
    })
    print(currentPostLike)
    print(currentUser)
    if (currentPostLike == null) {
      const newPostLike = new PostLike({
        post: currentPost.id,
        user: currentUser.id,
        updated: Date.now(),
        created: Date.now()
      })
      await newPostLike.save()
      await Post.findByIdAndUpdate(currentPost.id, {
        likeCount: await PostLike.countDocuments({
          post: currentPost.id,
          liked: true
        }),
        $push: { likes: newPostLike.id }
      })
      if (currentUser.id != currentPost.author) {
        try {
          await sendNotification(
            (await User.findById(currentPost.author)).fcmToken,
            'You have a new notification',
            `@${currentUser.username} has liked your post!`
          )
        } catch (error) {
          print(error)
        }
      }
      return sendSuccess(newPostLike, res)
    } else {
      currentPostLike.updated = Date.now()
      currentPostLike.liked = !currentPostLike.liked
      await currentPostLike.save()
      await Post.findByIdAndUpdate(currentPost.id, {
        likeCount: await PostLike.countDocuments({
          post: currentPost.id,
          liked: true
        })
      })
      return sendSuccess(currentPostLike, res)
    }
  } catch (error) {
    sendError(error, res)
  }
})

router.get('/comment/:post', async (req, res, next) => {
  let startsAt = Date.now()
  if (req.query.startsAt) {
    startsAt = Number.parseInt(req.query.startsAt)
  }
  const page = Number.parseInt(req.query.page)
  const postComments = await PostComment.find({
    post: req.params.post,
    created: { $lte: startsAt },
    deleted: false,
    blocked: false
  })
    .sort({ created: -1 })
    .populate({
      path: 'user',
      populate: { path: 'class', populate: { path: 'university' } }
    })
    .limit(50)
    .skip(page * 50)
  return sendSuccess(postComments, res)
})

router.post('/comment/:post', async (req, res, next) => {
  if (!req.body.comment) return sendError('Comment required', res)
  try {
    const currentUser = await getAuthUser(req.headers)
    const newComment = PostComment({
      post: req.params.post,
      user: currentUser.id,
      comment: req.body.comment,
      updated: Date.now(),
      created: Date.now()
    })
    const currentPost = Post.findById(req.params.post)
    if (currentUser.id != currentPost.author) {
      try {
        await sendNotification(
          (await User.findById(currentPost.author)).fcmToken,
          'You have a new notification',
          `@${currentUser.username} has replied to your post!`
        )
      } catch (error) {
        print(error)
      }
    }
    await newComment.save()
    await Post.findByIdAndUpdate(req.params.post, {
      commentCount: await PostComment.countDocuments({
        post: req.params.post,
        deleted: false
      })
    })
    return sendSuccess(
      await PostComment.findById(newComment.id).populate({
        path: 'user',
        populate: { path: 'class', populate: { path: 'university' } }
      }),
      res
    )
  } catch (error) {
    return sendError(error, res)
  }
})

router.delete('/comments/:id', async (req, res, next) => {
  try {
    const currentUser = await getAuthUser(req.headers)
    const postComment = await PostComment.findById(req.params.id)
    if (postComment.user != currentUser.id) {
      return next("You can't delete someone else's comment")
    }
    if (postComment.deleted) {
      return next('Commented already deleted')
    }

    await PostComment.findByIdAndUpdate(postComment.id, {
      deleted: true,
      updated: Date.now()
    })

    await Post.findByIdAndUpdate(postComment.post, {
      commentCount: await PostComment.countDocuments({
        post: postComment.post,
        deleted: false
      })
    })

    return sendSuccess('Comment deleted successfully', res)
  } catch (error) {
    return next(error.message)
  }
})

module.exports = router
