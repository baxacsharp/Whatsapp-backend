import { body } from "express-validator"

export const ChatValidator = [
    body("sender").exists().isString().withMessage("Sender is a mandatory field"),
    body("receiver").exists().isString().withMessage("Receiver is a mandatory field")
]
