const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');
const User = require('../models/User');

// Upload user avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    // Upload to Cloudinary (buffer)
    const result = await cloudinary.uploader.upload_stream({
      folder: 'avatars',
      resource_type: 'image',
      format: 'png',
      transformation: [{ width: 300, height: 300, crop: 'thumb' }]
    }, async (error, uploadResult) => {
      if (error) throw error;
      // Update user document
      const user = await User.findById(req.user._id);
      user.avatar = {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url
      };
      await user.save();
      res.json({ success:true, avatar: user.avatar });
    });
    // Pipe buffer
    result.end(req.file.buffer);
  } catch (err) {
    logger.error('Avatar upload error:', err);
    res.status(400).json({ success:false, error: err.message });
  }
};

// Upload restaurant verification documents (multiple)
exports.uploadDocuments = async (req, res) => {
  try {
    if (!req.files || !req.files.length) throw new Error('No files uploaded');

    const user = await User.findById(req.user._id);

    // Initialize restaurantProfile if it doesn't exist
    if (!user.restaurantProfile) {
      user.restaurantProfile = {
        verificationDocuments: []
      };
    }

    // Initialize verificationDocuments array if it doesn't exist
    if (!user.restaurantProfile.verificationDocuments) {
      user.restaurantProfile.verificationDocuments = [];
    }

    const uploads = await Promise.all(req.files.map(file => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          folder: 'restaurant_docs',
          resource_type: 'raw'
        }, (error, result) => {
          if (error) return reject(error);
          resolve({
            public_id: result.public_id,
            url: result.secure_url,
            uploadedAt: new Date()
          });
        });
        stream.end(file.buffer);
      });
    }));

    // Append to restaurantProfile.verificationDocuments
    user.restaurantProfile.verificationDocuments.push(...uploads);
    await user.save();

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: uploads
    });
  } catch (err) {
    logger.error('Documents upload error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};
