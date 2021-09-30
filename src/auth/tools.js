import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import UserModel from "../services/users/schema.js"

if (process.env.TS_NODE_DEV || process.env.NODE_ENV === "test") require("dotenv").config()

const { JWT_SECRET, JWT_REFRESH_SECRET } = process.env
if (!JWT_SECRET || !JWT_REFRESH_SECRET) throw new Error("Environment variables unreachable.")

export const hashPassword = async plainPassword => {
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    return hashedPassword
}

export const JWTAuthenticate = async user => {
    const accessToken = await generateJWT({ _id: user._id })
    const refreshToken = await generateRefreshJWT({ _id: user._id })
    user.refreshToken = refreshToken
    await user.save()
    return { accessToken, refreshToken }
}

const generateJWT = payload =>
    new Promise((resolve, reject) =>
        jwt.sign(payload, JWT_SECRET, { expiresIn: "15 min" }, (err, token) => (err ? reject(err) : resolve(token)))
    )

const generateRefreshJWT = payload =>
    new Promise((resolve, reject) =>
        jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "1 week" }, (err, token) => (err ? reject(err) : resolve(token)))
    )

export const verifyToken = token =>
    new Promise((resolve, reject) =>
        jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
            if (err) reject(err)

            resolve(decodedToken)
        })
    )

const verifyRefreshToken = token =>
    new Promise((resolve, reject) =>
        jwt.verify(token, JWT_REFRESH_SECRET, (err, decodedToken) => (err ? reject(err) : resolve(decodedToken)))
    )

export const refreshTokens = async actualRefreshToken => {
    const content = await verifyRefreshToken(actualRefreshToken)
    const user = await UserModel.findById(content._id)

    if (!user) throw new Error("User not found")
    if (user.refreshToken === actualRefreshToken) {
        const newAccessToken = await generateJWT({ _id: user._id })
        const newRefreshToken = await generateRefreshJWT({ _id: user._id })
        user.refreshToken = newRefreshToken
        await user.save()
        return { newAccessToken, newRefreshToken }
    } else throw new Error("Refresh Token not valid")
}

export const cookieOptions = { httpOnly: true, sameSite: "none", secure: true }
