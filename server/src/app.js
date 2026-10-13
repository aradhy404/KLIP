import "dotenv/config"
import express from "express"
import authroutes from "./routes/auth.routes.js"
import entryRoutes from "./routes/entry.routes.js"


const app = express()
app.use(express.json())
app.use('/api/auth', authroutes)
app.use('/api/entry', entryRoutes)


const port = process.env.PORT || 3000



app.listen(port, (req, res) => {
    console.log(`app is listening on ${port}`)
})
export default app