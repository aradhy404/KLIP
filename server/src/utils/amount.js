
const normalizeAmount = (amount) => {
    if (typeof amount !== "string" || !/^\d+$/.test(amount)) {
        return null;
    }

    const rupees = Number(amount);

    if (!Number.isSafeInteger(rupees) || rupees <= 0) {
        return null;
    }

    const paise = rupees * 100;

    if (!Number.isSafeInteger(paise)) {
        return null;
    }

    return paise;
};

export default normalizeAmount;
