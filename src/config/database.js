const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://sopanmasure_db_user:wishtree@cluster0.hu1i3la.mongodb.net/?appName=Cluster0';
    
    // Optimized connection options
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      family: 4, // Use IPv4, skip trying IPv6
    };

    await mongoose.connect(mongoURI, options);

    // Disable automatic index creation to prevent errors
    mongoose.set('autoIndex', false);

    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

    console.log('✓ MongoDB connected successfully');
    console.log(`✓ Connection pool size: ${options.maxPoolSize}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;
