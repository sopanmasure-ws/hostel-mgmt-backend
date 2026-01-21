const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = 'mongodb+srv://sopanmasure_db_user:wishtree@cluster0.hu1i3la.mongodb.net/?appName=Cluster0';
    
    await mongoose.connect(mongoURI);

    console.log('✓ MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
