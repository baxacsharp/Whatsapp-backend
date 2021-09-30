import express from "express"
import Model from "./schema.js"
import createError from "http-errors"
const roomRoutes = express.Router()

// POST /room

/**
 * req.body = { members: ['saidevid', 'tomid'] }
 *
 * const {`members } = req.body
 * let {`room } = RoomModel.find({ members })
 *
 * if room send room
 *
 *
 * room = new RoomModel(req.body)
 *
 * // if the room dont exist, clearly the sockets were not joined
 *
 * for each participant id, grab their socket and have these sockets join the new room id
 *
 * res send room._id
 *
 */

roomRoutes.post("/", async (req, res, next) => {
  try {
    const { members, roomName } = req.body
    const room = await Model.findOne({ members }).populate("members")

    if (room) res.status(200).send(room)
    else {
      const newRoom = new Model({ members, roomName })
      await newRoom.save()
      const populatedRoom = await Model.findOne({ members }).populate("members")
      // console.log(populatedRoom)
      res.status(201).send(populatedRoom)
    }
  } catch (error) {
    next(error)
  }
})
// FRONT END CLUES 🦊
// if (res.status === 200) => "OLD ROOM ID"
// else if (res.status === 201) => "NEW ROOM ID"
// else => "💩 WE LOST CONNECTION 🔌 OR SERVER EXPLODED 💥"

// GET chat history for room
// GET rooms for user with userid

// GET ROOMS WITH USER ID
roomRoutes.get("/", async (req, res, next) => {
  const myRooms = await Model.find({ members: req.user._id })
    .populate("members")
    .sort({ updatedAt: 1 })
  if (myRooms.length > 0) res.send(myRooms)
  else next(createError(404, "You are alone in this world"))
})

//GET CHATS IN ROOM WITH ID
roomRoutes.get("/:id", async (req, res, next) => {
  try {
    const room = await Model.findById(req.params.id)
      .populate("chats.sender")
      .populate("members")
    if (room) res.status(200).send({ chats: room.chats, members: room.members })
    else next(createError(404, "Room not found"))
  } catch (error) {
    next(error)
  }
})

export default roomRoutes

/*

    search user - in progress

    get /users/me/chats retrieve all chats (rooms) from db when logging in but not all history, participant id = my id
    get /users/me/chats/:id retrieve chat history from db, participant id = my id
    post /room with two user ids then join, if exist go there instead

*/
