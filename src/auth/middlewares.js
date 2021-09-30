import createError from "http-errors"
import UserModel from "../services/users/schema.js"
import { verifyToken } from "./tools.js"

export const JWTAuthMiddleware = async (req, res, next) => {
    if (!req.cookies.accessToken) next(createError(400, "No token provided"))
    else {
        try {
            const content = await verifyToken(req.cookies.accessToken)
            const user = await UserModel.findById(content._id)

            if (user) {
                req.user = user
                next()
            } else next(createError(404, "User not found"))
        } catch (error) {
            next(createError(403, "Token is invalid"))
        }
    }
}
