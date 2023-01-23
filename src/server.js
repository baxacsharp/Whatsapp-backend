import cors from "cors"
import csrf from "csurf"
import express from "express"
import passport from "passport"
import oauth from "./auth/oauth.js"
import cookieParser from "cookie-parser"
import createError from "http-errors"
import usersRoutes from "./services/users/index.js"
import roomRoutes from "./services/rooms/index.js"
import { catchAllHandler, error4xx } from "./errors.js"
import { JWTAuthMiddleware } from "./auth/middlewares.js"
import { cookieOptions } from "./auth/tools.js"
import listEndpoints from "express-list-endpoints"
import { SlowMinuteSpeedLimiter } from "./services/tools.js"
import { sockets } from "./index.js"
import abc from "../src/index"
const server = express()

if (process.env.TS_NODE_DEV || process.env.NODE_ENV === "test")
  require("dotenv").config()

const { FRONTEND_DEV_URL, FRONTEND_PROD_URL } = process.env
if (!FRONTEND_DEV_URL || !FRONTEND_PROD_URL)
  throw new Error("Environment variables unreachable.")

const whitelist = [
  FRONTEND_DEV_URL,
  FRONTEND_PROD_URL,
  `${FRONTEND_PROD_URL}/`,
  `${FRONTEND_DEV_URL}/`,
]
export const corsOptions = {
  origin: (origin, next) => {
    try {
      if (whitelist.indexOf(origin) !== -1) next(null, true)
      else
        next(
          createError(400, "Cross-Site Origin Policy blocked your request"),
          true
        )
    } catch (error) {
      next(error)
    }
  },
  credentials: true,
}

import fs from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
const noAvatar = join(
  dirname(fileURLToPath(import.meta.url)),
  "./resources/images/noavatar.png"
)
server.get("/images/noavatar.png", (req, res, next) => {
  res.sendFile(noAvatar)
})

server.use(cors(corsOptions))
server.use(express.json())
server.use(cookieParser())
server.use(passport.initialize({ session: true }))
//server.use(csrf({ cookie: cookieOptions }))

server.get("/socket", (req, res) => {
  const log = Object.entries(sockets).map(([uuid, socket]) => {
    return [uuid, socket.socket.rooms]
  })

  // console.log(log)

  res.send()
})
server.use("/users", usersRoutes)
server.use("/rooms", SlowMinuteSpeedLimiter, JWTAuthMiddleware, roomRoutes)

server.use(error4xx)
server.use(catchAllHandler)

console.table(listEndpoints(server))

export default server
