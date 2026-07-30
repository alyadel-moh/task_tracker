const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

function generateToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRES_IN }); // payload
}
function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
}
module.exports = {
  generateToken,
  verifyToken,
};
