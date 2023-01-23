import multer from "multer"
import express from "express"
import passport from "passport"
import mongoose from "mongoose"
import q2m from "query-to-mongo"
import createError from "http-errors"
import { v2 as cloudinary } from "cloudinary"
import { validationResult } from "express-validator"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import Model from "./schema.js"
import { cookieOptions } from "../../auth/tools.js"
import { checkIfAdmin } from "../../auth/permissions.js"
import { JWTAuthMiddleware } from "../../auth/middlewares.js"
import { refreshTokens, JWTAuthenticate } from "../../auth/tools.js"
import { LoginValidator, UserValidator } from "./validator.js"
import ChatModel from "../rooms/schema.js"
import {
  HeavyMinuteRateLimiter,
  NormalMinuteSpeedLimiter,
  SlowMinuteSpeedLimiter,
} from "../tools.js"
const { isValidObjectId } = mongoose
const userRouter = express.Router()

userRouter.post(
  "/register",
  HeavyMinuteRateLimiter,
  UserValidator,
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (errors.isEmpty()) {
        const entry = new Model(req.body)
        const result = await entry.save()

        if (result) {
          const { email, password } = req.body
          const user = await Model.checkCredentials(email, password)

          if (user) {
            const { accessToken, refreshToken } = await JWTAuthenticate(user)

            res.cookie("accessToken", accessToken, cookieOptions)
            res.cookie("refreshToken", refreshToken, {
              ...cookieOptions,
              path: "/users/refreshToken",
            })
            res.send(user)
          } else next(createError(500, "Something went wrong while logging in"))
        } else next(createError(500, "Something went wrong while registering"))
      } else next(createError(400, console.log(errors.mapped())))
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
)

userRouter.post(
  "/login",
  HeavyMinuteRateLimiter,
  LoginValidator,
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (errors.isEmpty()) {
        const { email, password } = req.body
        const user = await Model.checkCredentials(email, password)

        if (user) {
          const { accessToken, refreshToken } = await JWTAuthenticate(user)

          res.cookie("accessToken", accessToken, cookieOptions)
          res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            path: "/users/refreshToken",
          })
          res.send(user)
        } else next(createError(401, "Wrong credentials provided"))
      } else next(createError(400, errors.mapped()))
    } catch (error) {
      next(error)
    }
  }
)

userRouter.get(
  "/login/oauth/google/login",
  NormalMinuteSpeedLimiter,
  passport.authenticate("google", { scope: ["profile", "email"] })
)
userRouter.get(
  "/login/oauth/google/redirect",
  NormalMinuteSpeedLimiter,
  passport.authenticate("google"),
  async (req, res, next) => {
    try {
      const { tokens } = req.user
      res.cookie("accessToken", tokens.accessToken, cookieOptions)
      res.cookie("refreshToken", tokens.refreshToken, {
        ...cookieOptions,
        path: "/users/refreshToken",
      })
      res.redirect("/chat")
    } catch (error) {
      next(error)
    }
  }
)

userRouter.post(
  "/logout",
  HeavyMinuteRateLimiter,
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      let user = req.user
      user.refreshToken = undefined
      await user.save()
      res.clearCookie("accessToken", cookieOptions)
      res.clearCookie("refreshToken", cookieOptions)
      res.status(205).send("Logged out")
    } catch (error) {
      next(error)
    }
  }
)

userRouter.post(
  "/refreshToken",
  HeavyMinuteRateLimiter,
  async (req, res, next) => {
    try {
      if (!req.cookies.refreshToken)
        next(createError(400, "Refresh Token not provided"))
      else {
        const { newAccessToken, newRefreshToken } = await refreshTokens(
          req.cookies.refreshToken
        )
        res.cookie("accessToken", newAccessToken, cookieOptions)
        res.cookie("refreshToken", newRefreshToken, {
          ...cookieOptions,
          path: "/users/refreshToken",
        })
        res.send("OK")
      }
    } catch (error) {
      next(error)
    }
  }
)

// GET users
/**
 * /users?firstname=Zingo
 */

userRouter.get(
  "/",
  SlowMinuteSpeedLimiter,
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const query = q2m(req.query)
      const users = await Model.countDocuments(query.criteria)
      const maxLimit = 10
      if (!query.options.limit) query.options.limit = maxLimit
      query.options.limit =
        query.options.limit > maxLimit ? maxLimit : query.options.limit
      const result = await Model.find(query.criteria)
        .sort(query.options.sort)
        .skip(query.options.skip || 0)
        .limit(query.options.limit)
      const response = result.map((entry) => ({
        _id: entry._id,
        firstname: entry.firstname,
        surname: entry.surname,
        username: entry.username,
        avatar: entry.avatar,
      }))
      const pages = Math.ceil(users / query.options.limit)
      res
        .status(200)
        .send({ navigation: query.links("/users", users), pages, response })
    } catch (error) {
      next(error)
    }
  }
)

userRouter.get(
  "/me",
  NormalMinuteSpeedLimiter,
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      res.send(req.user)
    } catch (error) {
      next(error)
    }
  }
)

userRouter.get(
  "/me/chats",
  NormalMinuteSpeedLimiter,
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const result = await ChatModel.findOne({ room: req.user.room })
      res.send(result)
    } catch (error) {
      next(error)
    }
  }
)

userRouter.get(
  "/me/chats/:id",
  NormalMinuteSpeedLimiter,
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const result = await ChatModel.findById(req.params.id).populate("chats")
      res.send(result)
    } catch (error) {
      next(error)
    }
  }
)

userRouter.delete(
  "/me",
  HeavyMinuteRateLimiter,
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const user = req.user
      await user.deleteOne()
      res.status(404).send("User not found")
    } catch (error) {
      next(error)
    }
  }
)

userRouter.put(
  "/me",
  HeavyMinuteRateLimiter,
  JWTAuthMiddleware,
  async (req, res, next) => {
    const { firstname, surname, email, username } = req.body
    try {
      const errors = validationResult(req)
      if (errors.isEmpty()) {
        let user = req.user
        if (firstname) user.firstname = firstname
        if (surname) user.surname = surname
        if (username) user.username = username
        if (email) user.email = email
        //if (password) user.password = await hashPassword(req.body.password)

        const result = await user.save()

        res.status(200).send(result)
      } else next(createError(400, errors.mapped()))
    } catch (error) {
      next(error)
    }
  }
)

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "BW4" },
})
const upload = multer({ storage: cloudinaryStorage }).single("avatar")
userRouter.post(
  "/me/avatar",
  HeavyMinuteRateLimiter,
  JWTAuthMiddleware,
  upload,
  async (req, res, next) => {
    try {
      let user = req.user
      user.avatar = req.file.path
      await user.save()
      res.status(200).send(user)
    } catch (error) {
      next(error)
    }
  }
)

userRouter.get(
  "/:id",
  NormalMinuteSpeedLimiter,
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      if (!isValidObjectId(req.params.id))
        next(createError(400, `ID ${req.params.id} is invalid`))
      else {
        const result = await Model.findById(req.params.id)
        if (!result) next(createError(404, `ID ${req.params.id} was not found`))
        else res.status(200).send(result)
      }
    } catch (error) {
      next(error)
    }
  }
)

userRouter.delete(
  "/:id",
  HeavyMinuteRateLimiter,
  JWTAuthMiddleware,
  checkIfAdmin,
  async (req, res, next) => {
    try {
      let result
      if (!isValidObjectId(req.params.id))
        next(createError(400, `ID ${req.params.id} is invalid`))
      else
        result = await Model.findByIdAndDelete(req.params.id, {
          useFindAndModify: false,
        })

      if (result) res.status(204).send()
      else next(createError(404, `ID ${req.params.id} was not found`))
    } catch (error) {
      next(error)
    }
  }
)

const mongoPutOptions = {
  runValidators: true,
  new: true,
  useFindAndModify: false,
}
userRouter.put(
  "/:id",
  HeavyMinuteRateLimiter,
  JWTAuthMiddleware,
  checkIfAdmin,
  async (req, res, next) => {
    try {
      let result
      if (!isValidObjectId(req.params.id))
        next(createError(400, `ID ${req.params.id} is invalid`))
      else
        result = await Model.findByIdAndUpdate(
          req.params.id,
          req.body,
          mongoPutOptions
        )

      if (!result) next(createError(404, `ID ${req.params.id} was not found`))
      else res.status(200).send(result)
    } catch (error) {
      next(error)
    }
  }
)

export default userRouter
