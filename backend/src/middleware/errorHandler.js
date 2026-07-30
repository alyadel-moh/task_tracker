function errorHandler(err, req, res, next) {
    console.error(err);
    if (err.name === "SequelizeValidationError") {
        return res.status(400).json({ error: "Bad Request", message: err.errors.map(e => e.message) });
    }
    if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ error: "Conflict", message: err.errors.map(e => e.message) });
    }
    res.status(500).json({ error: "Internal Server Error", message: err.message });
}

module.exports = errorHandler;
