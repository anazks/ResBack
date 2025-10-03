const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://user:123@cluster0.xawpc.mongodb.net/recipe?retryWrites=true&w=majority&appName=Cluster0', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1); // Exit the process with failure
    }
}

module.exports = connectDB;