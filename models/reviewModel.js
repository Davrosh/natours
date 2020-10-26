// review / rating / createdAt / ref to tour / ref to user

const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: 1 });

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // calculates the count and average of all of the given tour's ratings and
  // persists it into the tour document.
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review
  // we need to calculate on post-hook so that the current document that was
  // only just calculated is taken into account when calculating the average.
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
// findById... is shorthand for findByOne...
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   // Alternative approach, not calling next in post and using pre and post
//   // hooks.
//   // here we pass data from the pre middleware to the post middleware using r
//   // we would like to have access to the document, but this points to the query
//   // instead since this is query middleware (we need to run it on findOne, not
//   // save) and so we use this.findOne() to get the document and its tour id key.
//   // However, we now need to run the calcAverageRatings from a post middleware
//   // so that we can calculate using the already updated data but we no longer
//   // access to the query in there. The solution is the one below using this.r:
//   this.r = await this.findOne();
//   // console.log(this.r);
//   next();
// });

reviewSchema.post(/^findOneAnd/, async function (doc, next) {
  // await this.findOne(); does NOT work here, query has already executed...

  // await this.r.constructor.calcAverageRatings(this.r.tour);
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.tour);
  }
  next();
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
