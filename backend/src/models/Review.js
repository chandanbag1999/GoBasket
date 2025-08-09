const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    images: [
      {
        publicId: String,
        url: String,
        alt: String,
      },
    ],
    helpfulVotes: {
      count: { type: Number, default: 0 },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    moderatorNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
reviewSchema.virtual("helpfulPercentage").get(function () {
  if (this.helpfulVotes.count === 0) return 0;
  return Math.round(
    (this.helpfulVotes.count / this.helpfulVotes.users.length) * 100
  );
});

// Instance methods
reviewSchema.methods.markHelpful = function (userId) {
  if (!this.helpfulVotes.users.includes(userId)) {
    this.helpfulVotes.users.push(userId);
    this.helpfulVotes.count += 1;
  }
  return this;
};

reviewSchema.methods.unmarkHelpful = function (userId) {
  const index = this.helpfulVotes.users.indexOf(userId);
  if (index > -1) {
    this.helpfulVotes.users.splice(index, 1);
    this.helpfulVotes.count -= 1;
  }
  return this;
};

// Static methods
reviewSchema.statics.findByProduct = function (productId, options = {}) {
  const { limit = 10, skip = 0, sort = { createdAt: -1 } } = options;

  return this.find({
    product: productId,
    status: "approved",
  })
    .populate("user", "firstName lastName profilePicture.url")
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

reviewSchema.statics.getProductReviewStats = function (productId) {
  return this.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
    {
      $project: {
        averageRating: { $round: ["$averageRating", 1] },
        totalReviews: 1,
        five: {
          $size: {
            $filter: {
              input: "$ratingDistribution",
              cond: { $eq: ["$$this", 5] },
            },
          },
        },
        four: {
          $size: {
            $filter: {
              input: "$ratingDistribution",
              cond: { $eq: ["$$this", 4] },
            },
          },
        },
        three: {
          $size: {
            $filter: {
              input: "$ratingDistribution",
              cond: { $eq: ["$$this", 3] },
            },
          },
        },
        two: {
          $size: {
            $filter: {
              input: "$ratingDistribution",
              cond: { $eq: ["$$this", 2] },
            },
          },
        },
        one: {
          $size: {
            $filter: {
              input: "$ratingDistribution",
              cond: { $eq: ["$$this", 1] },
            },
          },
        },
      },
    },
  ]);
};

// Compound indexes
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ rating: 1, status: 1 });

module.exports = mongoose.model("Review", reviewSchema);
