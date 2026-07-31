const { verifyToken } = require("../utils/jwt");
const { User } = require("../models");

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "User not found" });
    }
    req.user = user; // setting security context for the request
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "Invalid or expired token" });
  }
}

module.exports = authenticate;
