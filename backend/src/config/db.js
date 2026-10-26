const mongoose = require('mongoose');

const connectDB = async () => {
  const uri =
    process.env.JEST_WORKER_ID
      ? process.env.MONGODB_TEST_URI
      : process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MongoDB URI is not defined. Check your .env file.');
  }

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
