import cors from "cors"
import "dotenv/config"
import express from "express"
import authroutes from "./routes/auth.routes.js"
import entryRoutes from "./routes/entry.routes.js"


const app = express()

app.set("trust proxy",1)
app.use(cors({
    origin: process.env.CLIENT_URL
}))
app.use(express.json())
app.use('/api/auth', authroutes)
app.use('/api/entry', entryRoutes)


const port = process.env.PORT || 3000



app.listen(port, (req, res) => {
    console.log(`app is listening on ${port}`)
})
export default app