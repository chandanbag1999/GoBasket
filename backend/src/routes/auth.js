const express = require('express');
const AuthController = require('../controllers/authController');

// Import middleware
const { protect } = require('../middleware/auth');
const { rateLimits } = require('../middleware/security');
const { validationRules } = require('../middleware/validation');

const router = express.Router();


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

module.exports = router;
