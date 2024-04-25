const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs'); // For hashing passwords
require('dotenv').config();
const app = express();
const port = 3001;

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = process.env.MONGO_URI ; 
// Connect to MongoDB
mongoose .connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Connection failed:', err));

// Define User schema and model
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

// GET /users - Get a list of all users
app.get('/users', (req, res) => {
    User.find({})
        .then(users => res.json(users))
        .catch(err => res.status(500).json({ message: err.message }));
});

// POST /users - Create a new user
app.post('/users', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
        });

        // Save the user to the database
        const newUser = await user.save();

        // Respond with the newly created user
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /users/:id - Update a user by ID
app.put('/users/:id', async (req, res) => {
    const userId = req.params.id;
    const updateData = {
        name: req.body.name,
        email: req.body.email,
    };

    // Check if password is being updated
    if (req.body.password) {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        updateData.password = hashedPassword;
    }

    // Find and update the user
    try {
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Respond with the updated user
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /users/:id - Delete a user by ID
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;

    User.findByIdAndDelete(userId)
        .then(deletedUser => {
            if (!deletedUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Respond with a success message
            res.json({ message: 'User deleted successfully' });
        })
        .catch(err => res.status(400).json({ message: err.message }));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
