
const normalizePhone = (phone) => {
    if (typeof phone !== "string") {
        return null;
    }

    let normalized = phone.trim().replace(/[\s-]/g, "");

    if (normalized.startsWith("+91")) {
        normalized = normalized.slice(3);
    } else if (normalized.startsWith("0")) {
        normalized = normalized.slice(1);
    }

    if (!/^\d{10}$/.test(normalized)) {
        return null;
    }

    return normalized;
};

export default normalizePhone;
