import {Connection, pool} from "pg"
import "dotenv/config"

const pool = new pool({
    connectionString: processe.env.DATABASE_URL
})

export default pool