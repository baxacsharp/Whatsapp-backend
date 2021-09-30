import createError from "http-errors"
//import ChatModel from "../services/chat/schema.js"

export const checkIfAdmin = (req, res, next) => {
    const user = req.user
    if (user.role === "Admin") next()
    else next(createError(403))
}

export const checkUserEditPrivileges = (req, res, next) => {
    const user = req.user
    if (user.role === "Admin" || user._id === req.params.id) next()
    else next(createError(403))
}

export const checkChatEditPrivileges = async (req, res, next) => {
    const user = req.user
    const { sender } = await ChatModel.findById(req.params.id)
    if (sender._id === user._id) next()
    if (user.role === "Admin") next()
    else next(createError(403))
}

export const checkIfHost = (req, res, next) => {
    const user = req.user
    if (user.role === "Host") next()
    else next(createError(403))
}
