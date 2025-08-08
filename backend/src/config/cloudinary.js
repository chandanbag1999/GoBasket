const cloudinary = require('cloudinary').v2;

class CloudinaryConfig {
  constructor() {
    this.configure();
  }

  configure() {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true, // Use HTTPS
      });

      console.log('✅ Cloudinary configured successfully');
    } catch (error) {
      console.error('❌ Cloudinary configuration failed:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection() {
    try {
      const result = await cloudinary.api.ping();
      console.log('✅ Cloudinary connection test:', result);
      return true;
    } catch (error) {
      console.error('❌ Cloudinary connection test failed:', error);
      return false;
    }
  }

  getCloudinary() {
    return cloudinary;
  }
}

module.exports = new CloudinaryConfig();
