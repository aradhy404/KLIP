
import pool from "../config/db.js";

const createEntryService = async ({
    creatorId,
    normalizedPhone,
    type,
    amountPaise,
    cleanDescription
}) => {
    const userResult = await pool.query(
        "SELECT id FROM users WHERE phone = $1",
        [normalizedPhone]
    );

    const counterparty = userResult.rows[0] ?? null;

    if (counterparty && counterparty.id === creatorId) {
        throw new Error("SELF_ENTRY_NOT_ALLOWED");
    }

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        const entryResult = await client.query(
            `INSERT INTO entries (
                creator_id,
                counterparty_id,
                counterparty_phone,
                type,
                amount_paise,
                description
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                creatorId,
                counterparty?.id ?? null,
                normalizedPhone,
                type,
                amountPaise,
                cleanDescription
            ]
        );

        const entry = entryResult.rows[0];

        await client.query(
            `INSERT INTO entry_events (
                entry_id,
                actor_id,
                action
            )
            VALUES ($1, $2, $3)`,
            [entry.id, creatorId, "created"]
        );

        await client.query("COMMIT");

        return entry;

    } catch (err) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        throw err;

    } finally {
        client?.release();
    }
};

export default createEntryService;
