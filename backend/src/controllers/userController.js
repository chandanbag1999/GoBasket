const User = require("../models/User");
const tokenService = require("../services/tokenService");
const emailService = require("../services/emailService");

class UserController {
  // Get current profile (rich)
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user || user.deletedAt) {
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });
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
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (e) {
      res
        .status(500)
        .json({ status: "error", message: "Failed to fetch profile" });
    }
  }

  // Update basic profile
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, phone } = req.body;
      const user = await User.findById(req.user._id);
      if (!user || user.deletedAt)
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });

      if (firstName !== undefined) user.firstName = firstName.trim();
      if (lastName !== undefined) user.lastName = (lastName || "").trim();
      if (phone !== undefined) user.phone = phone;

      await user.save();

      res.status(200).json({
        status: "success",
        message: "Profile updated",
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
    } catch (e) {
      if (e.code === 11000) {
        return res
          .status(409)
          .json({
            status: "error",
            message: "Phone already in use",
            code: "PHONE_EXISTS",
          });
      }
      res
        .status(500)
        .json({ status: "error", message: "Failed to update profile" });
    }
  }

  // Preferences
  async updatePreferences(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user || user.deletedAt)
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });

      user.preferences = {
        ...user.preferences.toObject(),
        ...req.body,
        notifications: {
          ...user.preferences.notifications,
          ...(req.body.notifications || {}),
        },
      };

      await user.save();

      res.status(200).json({
        status: "success",
        message: "Preferences updated",
        data: { preferences: user.preferences },
      });
    } catch (e) {
      res
        .status(500)
        .json({ status: "error", message: "Failed to update preferences" });
    }
  }

  // Addresses
  async listAddresses(req, res) {
    const user = await User.findById(req.user._id);
    res
      .status(200)
      .json({ status: "success", data: { addresses: user.addresses || [] } });
  }

  async addAddress(req, res) {
    try {
      const payload = req.body;
      const user = await User.findById(req.user._id);
      if (!user || user.deletedAt)
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });

      if (payload.isDefault) {
        user.addresses.forEach((a) => (a.isDefault = false));
      }

      user.addresses.push(payload);
      // if no default exists, set first as default
      if (!user.addresses.some((a) => a.isDefault)) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      res.status(201).json({
        status: "success",
        message: "Address added",
        data: { addresses: user.addresses },
      });
    } catch (e) {
      res
        .status(500)
        .json({ status: "error", message: "Failed to add address" });
    }
  }

  async updateAddress(req, res) {
    try {
      const { addressId } = req.params;
      const user = await User.findById(req.user._id);
      if (!user || user.deletedAt)
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });

      const addr = user.addresses.id(addressId);
      if (!addr)
        return res
          .status(404)
          .json({ status: "error", message: "Address not found" });

      const prevDefault = addr.isDefault;
      Object.assign(addr, req.body || {});
      if (req.body.isDefault === true) {
        user.addresses.forEach((a) => {
          if (a._id.toString() !== addressId) a.isDefault = false;
        });
        addr.isDefault = true;
      }
      // ensure at least one default
      if (!user.addresses.some((a) => a.isDefault)) {
        addr.isDefault = true;
      }

      await user.save();

      res.status(200).json({
        status: "success",
        message: "Address updated",
        data: { addresses: user.addresses },
      });
    } catch (e) {
      res
        .status(500)
        .json({ status: "error", message: "Failed to update address" });
    }
  }

  async deleteAddress(req, res) {
    try {
      const { addressId } = req.params;
      const user = await User.findById(req.user._id);
      if (!user || user.deletedAt)
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });

      const addr = user.addresses.id(addressId);
      if (!addr)
        return res
          .status(404)
          .json({ status: "error", message: "Address not found" });

      const wasDefault = addr.isDefault;
      addr.deleteOne();

      // If default removed, set another as default
      if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }

      await user.save();
      res
        .status(200)
        .json({
          status: "success",
          message: "Address deleted",
          data: { addresses: user.addresses },
        });
    } catch (e) {
      res
        .status(500)
        .json({ status: "error", message: "Failed to delete address" });
    }
  }

  // Change Email (with verification flow)
  async requestChangeEmail(req, res) {
    try {
      const { newEmail } = req.body;
      const user = await User.findById(req.user._id);
      if (!user || user.deletedAt)
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });

      const exists = await User.findOne({ email: newEmail.toLowerCase() });
      if (exists) {
        return res
          .status(409)
          .json({
            status: "error",
            message: "Email already in use",
            code: "EMAIL_EXISTS",
          });
      }

      const token = tokenService.generateEmailVerificationToken();
      await tokenService.storeVerificationToken(
        user._id,
        token,
        "change_email",
        60
      ); // 60 min
      // send email
      try {
        await emailService.queueEmail({
          to: newEmail,
          subject: "Verify your new email",
          text: `Use this link to verify your new email: ${process.env.CLIENT_URL}/verify-new-email?token=${token}`,
          html: `<p>Verify your new email:</p><a href="${process.env.CLIENT_URL}/verify-new-email?token=${token}">Verify</a>`,
        });
      } catch (err) {
        // log and continue
      }

      res
        .status(200)
        .json({
          status: "success",
          message: "Verification email sent to new address",
        });
    } catch (e) {
      res
        .status(500)
        .json({ status: "error", message: "Failed to request email change" });
    }
  }

  async confirmChangeEmail(req, res) {
    try {
      const { token } = req.body;
      const data = await tokenService.verifyVerificationToken(
        token,
        "change_email"
      );
      if (!data)
        return res
          .status(400)
          .json({ status: "error", message: "Invalid or expired token" });

      const user = await User.findById(data.userId);
      if (!user || user.deletedAt)
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });

      // token payload doesn’t include email, so store new email in a temporary key if needed
      // Simpler approach: encode email in token storage data
      // For now, ask client to send newEmail along with token (more secure is server-side store). Example update:
      // This sample expects client sent newEmail in req.body.newEmail
      if (!req.body.newEmail) {
        return res
          .status(400)
          .json({
            status: "error",
            message: "newEmail is required to complete change",
          });
      }
      const exists = await User.findOne({
        email: req.body.newEmail.toLowerCase(),
      });
      if (exists)
        return res
          .status(409)
          .json({ status: "error", message: "Email already in use" });

      user.email = req.body.newEmail.toLowerCase();
      user.isVerified = true; // new email verified by token
      await user.save();

      res
        .status(200)
        .json({
          status: "success",
          message: "Email updated successfully",
          data: { email: user.email },
        });
    } catch (e) {
      res
        .status(500)
        .json({ status: "error", message: "Failed to change email" });
    }
  }

  // Delete account (soft delete)
  async deleteAccount(req, res) {
    try {
      const { confirm } = req.body;
      if (!confirm)
        return res
          .status(400)
          .json({ status: "error", message: "Confirmation required" });

      const user = await User.findById(req.user._id);
      if (!user)
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });

      user.isActive = false;
      user.deletedAt = new Date();
      await user.save();

      // Revoke sessions
      await tokenService.revokeAllUserSessions(user._id);

      res
        .status(200)
        .json({
          status: "success",
          message:
            "Account deleted (soft). Contact support to restore within retention window.",
        });
    } catch (e) {
      res
        .status(500)
        .json({ status: "error", message: "Failed to delete account" });
    }
  }
}

module.exports = new UserController();
