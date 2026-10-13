import jwt from "jsonwebtoken"


const reqAuthMiddleware = (req,res,next)=>{
    const token = req.headers.authorization

    if(!token || !token.startsWith("Bearer ")){
        return res.status(401).json({error:"invalid session id"})
    }
    try{
         const tokenValue = req.headers.authorization.split(' ')[1]
         const decoded = jwt.verify(tokenValue, process.env.MY_JWT_SECRET)
         req.user = decoded
         next()
         
    }catch(err){
        console.error(err)
        res.status(401).json({ error: "Unauthorize" })
    }
}

export default reqAuthMiddleware