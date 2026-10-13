import express from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import jwt from "jsonwebtoken"
import reqAuthMiddleware from "../middleware/reqAuth.js";
import rateLimiter from "express-rate-limit"
import normalizephone from "../utils/phone.js";


const router = express.Router();

const authLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many request from the device" }

})


router.post("/register", authLimiter, async (req, res) => {

    if (!process.env.MY_JWT_SECRET) {
        return res.status(500).json({ error: "Server configuration error" })
    }


    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
        return res.status(400).json({
            error: "Give the complete user info"
        });
    }
    if (typeof name !== 'string' || typeof phone !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: "valid name, password and phone number is required" })
    }


    const cleanName = name.trim()


    if (!cleanName || cleanName.length > 100) {
        return res.status(400).json({
            error: "Name must contain 1-100 character"
        });
    }
    const normalizedPhone = normalizephone(phone);

    if (!normalizedPhone) {
        return res.status(400).json({
            error: "Invalid phone number"
        });
    }



    if (password.length < 8 || Buffer.byteLength(password, "utf-8") > 72) {
        return res.status(400).json({ error: "password must be atleast 8 characters" })
    }

    let client
    try {

        client = await pool.connect()

        const hashed_password = await bcrypt.hash(password, 10);
        await client.query('BEGIN')

        const result = await client.query(
            "INSERT INTO users (name, phone, pass_hashed) VALUES ($1, $2, $3) RETURNING id, name, phone",
            [cleanName, normalizedPhone, hashed_password]
        );
        const newUser = result.rows[0]

        await client.query("UPDATE entries SET counterparty_id = $1 WHERE counterparty_phone = $2 AND counterparty_id IS NULL", [newUser.id, newUser.phone])

        await client.query('COMMIT')

        const token = jwt.sign(
            { id: newUser.id },
            process.env.MY_JWT_SECRET,
            { expiresIn: "7d" }
        )

        return res.status(201).json({
            success: true,
            message: "User registered",
            token,
            data: result.rows[0]
        });

    } catch (err) {

        await client?.query("ROLLBACK").catch(() => { })

        console.error(err);

        if (err.code === "23505") {
            return res.status(409).json({
                error: "Phone number is already registered"
            });
        }

        return res.status(500).json({
            error: "Something went wrong"
        });
    } finally {
        client?.release()
    }
});

router.post('/login', authLimiter, async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({
            error: "Give the complete user info"
        });
    }
    if (typeof phone !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: "valid password and phone number is required" })
    }


    const normalizedPhone = normalizephone(phone);

    if (!normalizedPhone) {
        return res.status(400).json({
            error: "Invalid phone number"
        });
    }


    try {
        const result = await pool.query("SELECT id, name, phone, pass_hashed FROM users WHERE phone = $1", [normalizedPhone])

        const user = result.rows[0]



        if (!user) {
            return res.status(401).json({
                error: "Invalid phone number or password"
            });
        }
        const compare = await bcrypt.compare(password, user.pass_hashed)
        if (!compare) {
            return res.status(401).json({ error: "Invalid phone number or password" })
        }
        const token = jwt.sign(
            { id: user.id },
            process.env.MY_JWT_SECRET,
            { expiresIn: "7d" }
        )
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                id: user.id,
                name: user.name,
                phone: user.phone
            }
        })

    } catch (err) {
        console.error("Login error:", err);

        return res.status(500).json({
            error: "Something went wrong"
        });
    }


})






export default router;
