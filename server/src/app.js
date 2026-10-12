import "dotenv/config"
import express from "express"
import authroutes from "./routes/auth.routes.js"


const app = express()
app.use(express.json())
app.use('/api/auth', authroutes)


const port = process.env.PORT || 3000



app.listen(port, (req, res) => {
    console.log(`app is listening on ${port}`)
})
export default app