import express from "express"
import reqAuthMiddleware from "../middleware/reqAuth.js"
import {createEntry,listEntries} from "../controllers/entry.controller.js"

const router = express.Router()

router.post('/',reqAuthMiddleware,createEntry)
router.get('/',reqAuthMiddleware,listEntries)

export default router