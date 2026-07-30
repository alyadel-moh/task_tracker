const { User } = require('../models')
const {generateToken} = require('../utils/jwt')

const SALT_ROUNDS = 12;

async function register(req, res,next) {
    try {
        const {name, email, password } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Bad Request', message: 'Name, email, and password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Bad Request', message: 'Password must be at least 8 characters long' });
        }
        const user = await User.create({ name, email, password });
        res.status(201).json({ user : { id: user.id, name: user.name, email: user.email }, message: 'User registered successfully' });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Conflict', message: 'Email already exists' });
        }
        next(error);
    }
}
async function login(req, res,next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Bad Request', message: 'Email and password are required' });
        }
        const user = await User.scope('withPassword').findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
        }
        const matches = await user.validPassword(password);
        if (!matches) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Invalid password' });
        }
        const token = generateToken({ id: user.id, email: user.email });
        res.status(200).json({ user : { id: user.id, name: user.name, email: user.email }, message: 'Login successful', token });
    } catch (error) {
        next(error);
    }
}
async function me(req, res) {
    const { id, name, email } = req.user;
    res.status(200).json({ user: { id, name, email } });

}
async function logout(req, res) {
    // Invalidate the token on the client side by removing it from local storage or cookies
    res.status(200).json({ message: 'Logout successful' });
}
module.exports = {
    register,
    login,
    me,
    logout,
};
