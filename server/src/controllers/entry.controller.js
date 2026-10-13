import createEntryService from "../services/entry.serivce.js"
import normalizePhone from "../utils/phone.js"
import normalizeAmount from "../utils/amount.js";



const createEntry = async (req, res) => {
    const { type, amount, description, counterpartyPhone } = req.body
    const normalizedPhone = normalizePhone(counterpartyPhone)
    if (!normalizedPhone) {
        return res.status(400).json({ error: "enter a valid number" })
    }
    if (!["money", "favour"].includes(type)) {
        return res.status(400).json({ error: "Type must be either favor or money" })
    }
    // if(!phone || !amount){
    //     return res.status(400).json({error:"give the complete credentials"})
    // }
    if (typeof description !== 'string') {
        return res.status(400).json({ error: "invalid formate" })
    }
    const cleanDescription = description.trim()
    if (cleanDescription.length > 500) {
        return res.status(400).json({ error: "description should be under 500 characters" })
    }
    let amountPaise = null;

    if (type === "money") {
        amountPaise = normalizeAmount(amount);

        if (amountPaise === null) {
            return res.status(400).json({
                error: "Invalid amount"
            });
        }
    }
    try {
        const entry = await createEntryService({
            creatorId: req.user.id,
            normalizedPhone,
            type,
            amountPaise,
            description: cleanDescription
        })
        res.status(201).json(entry)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "failed to create the entry of the user" })
    }

}

export default createEntry