import express from "express"
import reqAuthMiddleware from "../middleware/reqAuth.js"
import createEntry from "../controllers/entry.controller.js"

const router = express.Router()

router.post('/',reqAuthMiddleware,createEntry)

export default router