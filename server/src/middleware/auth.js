import jwt from "jsonwebtoken"
import "dotenv/config"


const authMiddleware = (req,res,next)=>{
    const token = req.headers.authorization

    if(!token || !token.startsWith("Bearer ")){
        return res.status(401).json({error:"invalid session id"})
    }
    try{
         const tokenValue = req.headers.authorization.split(' ')[1]
         const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET)
         req.user = decoded
         next()
         
    }catch(err){
        console.error(err)
        res.status(401).json({ error: "failed authorization" })
    }
}

export default authMiddleware