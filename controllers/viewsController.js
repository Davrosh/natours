// const cloudinary = require('cloudinary').v2;
const getCloudinaryUrl = require('../utils/getCloudinaryUrl');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// const getCloudinaryUrl = (doc) => {
//   // split with respect to the first '/'
//   const [version, url] = doc.photo.split(/\/(.+)/);
//   //console.log(version, url);
//   return cloudinary.url(url, {
//     transformation: [
//       { width: 500, height: 500, gravity: 'faces', crop: 'fill' },
//       { quality: 'auto', fetch_format: 'auto' },
//     ],
//     secure: true,
//     version: version,
//   });
// };

// IMPORTANT: here we can plug variables to have ready for use inside pug
// templates.
exports.plugRequires = (req, res, next) => {
  // res.locals.cloudinary = cloudinary;

  res.locals.getCloudinaryUrl = getCloudinaryUrl;
  next();
};

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  // set in bookingController.getCheckoutSession()
  if (alert === 'booking') {
    // pass it on to the front-end
    res.locals.alert =
      "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediately, please come back later.";
  }
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection

  const tours = await Tour.find();
  // 2) Build template

  // 3) Render that template using tour data from 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get the data, for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  // 2) Build template

  // 3) Render template using data from 1)
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);

  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      // return the updated document as a result.
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
