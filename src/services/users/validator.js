import { body } from "express-validator"

export const UserValidator = [
  body("firstname")
    .exists()
    .isString()
    .withMessage("Firstname is a mandatory field"),
  body("surname")
    .exists()
    .isString()
    .withMessage("Surname is a mandatory field"),
  body("email")
    .exists()
    .isEmail()
    .isLength({ max: 64 })
    .withMessage("Email is a mandatory field")
    .isEmail()
    .withMessage("Invalid email"),
  body("password")
    .exists()
    .isStrongPassword()
    .withMessage("Password is a mandatory field and needs to be strong"),
]

export const UserEditValidator = [
  body("firstname")
    .isString()
    .withMessage("Firstname needs to be of type string"),
  body("surname").isString().withMessage("Surname needs to be of type string"),
  body("username")
    .isString()
    .withMessage("Username needs to be of type string"),
  body("email")
    .isLength({ max: 64 })
    .withMessage("Email is a mandatory field")
    .isEmail()
    .withMessage("Invalid email"),
  body("password")
    .exists()
    .isStrongPassword()
    .withMessage("Password is a mandatory field and needs to be strong"),
]

export const LoginValidator = [
  body("email")
    .exists()
    .withMessage("Email is a mandatory field")
    .isEmail()
    .withMessage("Invalid email"),
  body("password").exists().withMessage("Password is a mandatory field"),
]
