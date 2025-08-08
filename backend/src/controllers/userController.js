const User = require("../models/User");
const tokenService = require("../services/tokenService");
const emailService = require("../services/emailService");

class UserController {
  // Get current user profile (rich version)
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user._id);

      if (!user || user.deletedAt) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      res.status(200).json({
        status: "success",
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            profilePicture: user.profilePicture,
            preferences: user.preferences,
            addresses: user.addresses,
            lastLogin: user.lastLogin,
            accountAge: user.accountAge,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get profile error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch profile",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Update basic profile information
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, phone } = req.body;
      const user = await User.findById(req.user._id);

      if (!user || user.deletedAt) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Update fields if provided
      if (firstName !== undefined) user.firstName = firstName.trim();
      if (lastName !== undefined) user.lastName = (lastName || "").trim();
      if (phone !== undefined) user.phone = phone;

      await user.save();

      console.log(`✅ Profile updated for user: ${user.email}`);

      res.status(200).json({
        status: "success",
        message: "Profile updated successfully",
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            fullName: user.fullName,
          },
        },
      });
    } catch (error) {
      console.error("❌ Update profile error:", error);

      if (error.code === 11000) {
        return res.status(409).json({
          status: "error",
          message: "Phone number already in use",
          code: "PHONE_EXISTS",
        });
      }

      res.status(500).json({
        status: "error",
        message: "Failed to update profile",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Update user preferences
  async updatePreferences(req, res) {
    try {
      const user = await User.findById(req.user._id);

      if (!user || user.deletedAt) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Merge preferences
      user.preferences = {
        ...user.preferences.toObject(),
        ...req.body,
        notifications: {
          ...user.preferences.notifications,
          ...(req.body.notifications || {}),
        },
      };

      await user.save();

      console.log(`✅ Preferences updated for user: ${user.email}`);

      res.status(200).json({
        status: "success",
        message: "Preferences updated successfully",
        data: {
          preferences: user.preferences,
        },
      });
    } catch (error) {
      console.error("❌ Update preferences error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to update preferences",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // List all user addresses
  async listAddresses(req, res) {
    try {
      const user = await User.findById(req.user._id);

      if (!user || user.deletedAt) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      res.status(200).json({
        status: "success",
        data: {
          addresses: user.addresses || [],
          count: user.addresses?.length || 0,
        },
      });
    } catch (error) {
      console.error("❌ List addresses error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch addresses",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Add new address
  async addAddress(req, res) {
    try {
      const addressData = req.body;
      const user = await User.findById(req.user._id);

      if (!user || user.deletedAt) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // If this address is set as default, unset others
      if (addressData.isDefault) {
        user.addresses.forEach((addr) => (addr.isDefault = false));
      }

      // Add new address
      user.addresses.push(addressData);

      // If no default exists, set first address as default
      if (!user.addresses.some((addr) => addr.isDefault)) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      console.log(`✅ Address added for user: ${user.email}`);

      res.status(201).json({
        status: "success",
        message: "Address added successfully",
        data: {
          addresses: user.addresses,
          count: user.addresses.length,
        },
      });
    } catch (error) {
      console.error("❌ Add address error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to add address",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Update existing address
  async updateAddress(req, res) {
    try {
      const { addressId } = req.params;
      const updateData = req.body;
      const user = await User.findById(req.user._id);

      if (!user || user.deletedAt) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      const address = user.addresses.id(addressId);

      if (!address) {
        return res.status(404).json({
          status: "error",
          message: "Address not found",
          code: "ADDRESS_NOT_FOUND",
        });
      }

      // Update address fields
      Object.assign(address, updateData);

      // Handle default address logic
      if (updateData.isDefault === true) {
        user.addresses.forEach((addr) => {
          if (addr._id.toString() !== addressId) {
            addr.isDefault = false;
          }
        });
        address.isDefault = true;
      }

      // Ensure at least one default address exists
      if (!user.addresses.some((addr) => addr.isDefault)) {
        address.isDefault = true;
      }

      await user.save();

      console.log(`✅ Address updated for user: ${user.email}`);

      res.status(200).json({
        status: "success",
        message: "Address updated successfully",
        data: {
          addresses: user.addresses,
        },
      });
    } catch (error) {
      console.error("❌ Update address error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to update address",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Delete address
  async deleteAddress(req, res) {
    try {
      const { addressId } = req.params;
      const user = await User.findById(req.user._id);

      if (!user || user.deletedAt) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      const address = user.addresses.id(addressId);

      if (!address) {
        return res.status(404).json({
          status: "error",
          message: "Address not found",
          code: "ADDRESS_NOT_FOUND",
        });
      }

      const wasDefault = address.isDefault;
      address.deleteOne();

      // If deleted address was default, set another as default
      if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      console.log(`✅ Address deleted for user: ${user.email}`);

      res.status(200).json({
        status: "success",
        message: "Address deleted successfully",
        data: {
          addresses: user.addresses,
          count: user.addresses.length,
        },
      });
    } catch (error) {
      console.error("❌ Delete address error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to delete address",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Request email change
  async requestChangeEmail(req, res) {
    try {
      const { newEmail } = req.body;
      const user = await User.findById(req.user._id);

      if (!user || user.deletedAt) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Check if new email already exists
      const existingUser = await User.findOne({
        email: newEmail.toLowerCase(),
        deletedAt: null,
      });

      if (existingUser) {
        return res.status(409).json({
          status: "error",
          message: "Email already in use",
          code: "EMAIL_EXISTS",
        });
      }

      // Generate verification token
      const token = tokenService.generateEmailVerificationToken();

      // Store token with new email in Redis
      await tokenService.storeVerificationToken(
        user._id,
        token,
        "change_email",
        60 // 60 minutes
      );

      // Send verification email to new address
      try {
        await emailService.queueEmail({
          to: newEmail,
          subject: "🔄 Verify Your New Email - Grocery App",
          text: `Click this link to verify your new email: ${process.env.CLIENT_URL}/verify-new-email?token=${token}`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              <h2>🔄 Verify Your New Email</h2>
              <p>Hello ${user.firstName},</p>
              <p>Click the button below to verify your new email address:</p>
              <a href="${process.env.CLIENT_URL}/verify-new-email?token=${token}" 
                 style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify New Email
              </a>
              <p>This link will expire in 60 minutes.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.warn("Failed to send email change verification:", emailError);
      }

      console.log(
        `✅ Email change requested for user: ${user.email} -> ${newEmail}`
      );

      res.status(200).json({
        status: "success",
        message:
          "Verification email sent to new address. Please check your email.",
        data: {
          newEmail: newEmail.replace(/(.{2})(.*)(?=.{2})/, "$1***"),
          expiresIn: "60 minutes",
        },
      });
    } catch (error) {
      console.error("❌ Request email change error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to request email change",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Confirm email change
  async confirmChangeEmail(req, res) {
    try {
      const { token, newEmail } = req.body;

      const tokenData = await tokenService.verifyVerificationToken(
        token,
        "change_email"
      );

      if (!tokenData) {
        return res.status(400).json({
          status: "error",
          message: "Invalid or expired token",
          code: "INVALID_TOKEN",
        });
      }

      const user = await User.findById(tokenData.userId);

      if (!user || user.deletedAt) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Verify new email is still available
      const existingUser = await User.findOne({
        email: newEmail.toLowerCase(),
        deletedAt: null,
      });

      if (existingUser) {
        return res.status(409).json({
          status: "error",
          message: "Email already in use",
          code: "EMAIL_EXISTS",
        });
      }

      // Update email
      user.email = newEmail.toLowerCase();
      user.isVerified = true; // New email is verified by token
      await user.save();

      console.log(`✅ Email changed successfully for user: ${user._id}`);

      res.status(200).json({
        status: "success",
        message: "Email updated successfully",
        data: {
          email: user.email,
        },
      });
    } catch (error) {
      console.error("❌ Confirm email change error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to change email",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Delete account (soft delete)
  async deleteAccount(req, res) {
    try {
      const { confirm, reason } = req.body;

      if (!confirm) {
        return res.status(400).json({
          status: "error",
          message: "Account deletion confirmation required",
          code: "CONFIRMATION_REQUIRED",
        });
      }

      const user = await User.findById(req.user._id);

      if (!user || user.deletedAt) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Soft delete user
      user.isActive = false;
      user.deletedAt = new Date();

      if (reason) {
        user.deletionReason = reason;
      }

      await user.save();

      // Revoke all user sessions
      await tokenService.revokeAllUserSessions(user._id);

      console.log(
        `✅ Account deleted for user: ${user.email}, reason: ${
          reason || "not provided"
        }`
      );

      res.status(200).json({
        status: "success",
        message:
          "Account deleted successfully. Contact support within retention period to restore.",
        data: {
          deletedAt: user.deletedAt,
        },
      });
    } catch (error) {
      console.error("❌ Delete account error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to delete account",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }
}

module.exports = new UserController();
