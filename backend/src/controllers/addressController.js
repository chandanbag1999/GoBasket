const User = require('../models/User');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Get user addresses (GET /api/v1/auth/addresses)
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      count: user.addresses.length,
      data: {
        addresses: user.addresses
      }
    });

  } catch (error) {
    logger.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching addresses'
    });
  }
};

// Add new address (POST /api/v1/auth/addresses)
exports.addAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      title,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country = 'India',
      coordinates,
      isDefault = false
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check address limit (max 5 addresses per user)
    if (user.addresses.length >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 addresses allowed per user'
      });
    }

    // If this is the first address or isDefault is true, make it default
    const shouldBeDefault = user.addresses.length === 0 || isDefault;

    // If making this default, remove default from others
    if (shouldBeDefault) {
      user.addresses.forEach(address => {
        address.isDefault = false;
      });
    }

    // Create new address
    const newAddress = {
      title: title.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : '',
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: country.trim(),
      coordinates: coordinates || {},
      isDefault: shouldBeDefault
    };

    user.addresses.push(newAddress);
    await user.save();

    const addedAddress = user.addresses[user.addresses.length - 1];

    logger.info('Address added successfully', {
      userId: user._id,
      addressId: addedAddress._id,
      city: city,
      isDefault: shouldBeDefault,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: {
        address: addedAddress
      }
    });

  } catch (error) {
    logger.error('Add address error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error adding address'
    });
  }
};

// Update address (PUT /api/v1/auth/addresses/:addressId)
exports.updateAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { addressId } = req.params;
    const updateData = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find address
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    // If making this default, remove default from others
    if (updateData.isDefault === true) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    // Update address fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== '_id') {
        address[key] = updateData[key];
      }
    });

    await user.save();

    logger.info('Address updated successfully', {
      userId: user._id,
      addressId: addressId,
      updatedFields: Object.keys(updateData),
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: {
        address: address
      }
    });

  } catch (error) {
    logger.error('Update address error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating address'
    });
  }
};

// Delete address (DELETE /api/v1/auth/addresses/:addressId)
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find address
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;

    // Remove address
    user.addresses.pull(addressId);

    // If deleted address was default, make first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    logger.info('Address deleted successfully', {
      userId: user._id,
      addressId: addressId,
      wasDefault: wasDefault,
      remainingAddresses: user.addresses.length,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: {
        remainingAddresses: user.addresses.length
      }
    });

  } catch (error) {
    logger.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting address'
    });
  }
};

// Set default address (PUT /api/v1/auth/addresses/:addressId/default)
exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find address
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    // Remove default from all addresses
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });

    // Set this address as default
    address.isDefault = true;

    await user.save();

    logger.info('Default address set successfully', {
      userId: user._id,
      addressId: addressId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Default address set successfully',
      data: {
        address: address
      }
    });

  } catch (error) {
    logger.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error setting default address'
    });
  }
};

