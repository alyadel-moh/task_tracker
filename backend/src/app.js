require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const { sequelize } = require('./models');
const app = express();
app.use(express.json()); // parse incoming JSON requests
app.use(cors()); // configure CORS middleware

app.use('/api/auth', authRoutes); // use auth routes

// Error handling middleware
app.use(errorHandler);

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}
startServer();
module.exports = app;

