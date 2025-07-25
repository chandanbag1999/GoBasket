const express = require('express');
const AuthController = require('../controllers/authController');
const AddressController = require('../controllers/addressController');
const upload = require('../config/multer');
const FileHandler = require('../controllers/fileController');

// Import middleware
const { protect } = require('../middleware/auth');
const { rateLimits } = require('../middleware/security');
const { validationRules } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', 
  rateLimits.auth,                    
  validationRules.register,          
  AuthController.register                           
);


router.post('/login',
  rateLimits.auth,                   
  validationRules.login,             
  AuthController.login                              
);

router.post('/forgot-password',
  rateLimits.passwordReset,
  validationRules.forgotPassword,
  AuthController.forgotPassword
);

router.put('/reset-password/:token',
  rateLimits.passwordReset,
  validationRules.resetPassword,
  AuthController.resetPassword
);

router.get('/verify-email/:token',
  AuthController.verifyEmail
);

// Private routes (authentication required)
router.post('/logout',
  protect,                           
  AuthController.logout                             
);

// Get current user profile
router.get('/me',
  protect,                           
  AuthController.getMe                              
);

// Update user profile
router.put('/profile',
  protect,                           
  validationRules.updateProfile,     
  AuthController.updateProfile                      
);

// Avatar (single file)
router.put('/avatar',
  protect,
  upload.single('avatar'),
  FileHandler.uploadAvatar
);

// Restaurant docs (array, max 5 files)
router.post('/documents',
  protect,
  upload.array('documents', 5),
  FileHandler.uploadDocuments
);

router.put('/change-password',
  protect,
  rateLimits.auth,
  validationRules.changePassword,
  AuthController.changePassword
);

router.post('/resend-verification',
  protect,
  rateLimits.auth,
  AuthController.resendEmailVerification
);

router.post('/send-otp',
  protect,
  rateLimits.auth,
  AuthController.sendPhoneOTP
);

router.post('/verify-otp',
  protect,
  rateLimits.auth,
  validationRules.verifyOTP,
  AuthController.verifyPhoneOTP
);

// Address management routes
router.get('/addresses',
  protect,
  AddressController.getAddresses
);

router.post('/addresses',
  protect,
  validationRules.addAddress,
  AddressController.addAddress
);

router.put('/addresses/:addressId',
  protect,
  validationRules.addressIdParam,
  validationRules.updateAddress,
  AddressController.updateAddress
);

router.delete('/addresses/:addressId',
  protect,
  validationRules.addressIdParam,
  AddressController.deleteAddress
);

router.put('/addresses/:addressId/default',
  protect,
  validationRules.addressIdParam,
  AddressController.setDefaultAddress
);

module.exports = router;
