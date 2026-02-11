require('dotenv').config();
const mongoose = require('mongoose');

console.log('Attempting connection to MongoDB Atlas...');
console.log('URI:', process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@')); // Mask password

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('SUCCESS: MongoDB Connected');
        process.exit(0);
    })
    .catch((err) => {
        console.error('FAILURE: MongoDB Connection Error:', err.message);
        process.exit(1);
    });
