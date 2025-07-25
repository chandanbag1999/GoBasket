// Script to clear test user data from MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

const clearTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete the test user
    const result = await mongoose.connection.db.collection('users').deleteOne({
      email: 'john@example.com'
    });

    if (result.deletedCount > 0) {
      console.log('✅ Test user with email "john@example.com" deleted successfully');
    } else {
      console.log('ℹ️  No user found with email "john@example.com"');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

clearTestUser();
