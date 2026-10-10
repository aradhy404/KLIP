import express from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { Client } from "pg";
import jwt from "jsonwebtoken"

const router = express.Router();


router.post("/register", async (req, res) => {

    

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
    const cleanPhone = phone.trim()

    if (!cleanName || cleanName.length > 100) {
        return res.status(400).json({
            error: "Name must contain 1-100 character"
        });
    }


    if (!/^\d{10}$/.test(cleanPhone)) {
        return res.status(400).json({ error: "phone number must contain 10 digits" })
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf-8") > 72) {
        return res.status(400).json({ error: "password must be atleast 8 characters" })
    }

    const client = await pool.connect()
    try {
        

        await client.query('BEGIN')
        const hashed_password = await bcrypt.hash(password, 10);

        const result = await client.query(
            "INSERT INTO users (name, phone, pass_hashed) VALUES ($1, $2, $3) RETURNING id, name, phone",
            [cleanName, cleanPhone, hashed_password]
        );
        const newUser = result.rows[0]

        await client.query("UPDATE entries SET counterparty_id = $1 WHERE counterparty_phone = $2 AND counterparty_id IS NULL", [newUser.id, newUser.phone])

        await client.query('COMMIT')

        const token = jwt.sign(
            { id: newUser.id, phone: newUser.phone },
            process.env.MY_JWT_SECRETE,
            { expiresIn: "1h" }
        )

        return res.status(201).json({
            success: true,
            message: "User registered",
            data: result.rows[0]
        });

    } catch (err) {

        await client.query("ROLLBACK")

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






export default router;
