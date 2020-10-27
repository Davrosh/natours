const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// const sendEmail = require('../utils/email');
const Email = require('../utils/email');
const Review = require('../models/reviewModel');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  // Convert however many days to milliseconds
  // create httpOnly cookie
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // make it a secure cookie only in a production environment where we have
    // support for https.
    // Heroku does not support req.secure, so, we instead need to check this
    // header, which we enable in app.js.
    secure: req.secure || req.headers('x-forwarded-proto') === 'https',
  });

  // Remove the user from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // audit only what we want from req.body
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    // role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists & password is correct
  const user = await User.findOne({ email }).select('+password');
  //   console.log(user);

  // make sure that user is defined before awaiting the correctPassword method
  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client

  createSendToken(user, 200, req, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

// Special middleware we run in our route before every action that requires
// privileges. Makes sure the user is logged in.
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
    token = req.cookies.jwt;
  }

  //   console.log(token);

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  // 2) Verification of token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //   console.log(decoded);

  // 3) Check if user still exists

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user to whom this token belongs no longer exists', 401)
    );
  }

  // 4) Check if user changed passwords after the token was issued.
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  // if just logged out, just get out!
  if (req.cookies.jwt === 'loggedout') {
    return next();
  }
  if (req.cookies.jwt) {
    // 1) verify token
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    // 2) Check if user still exists

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next();
    }

    // 3) Check if user changed passwords after the token was issued.
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    // THERE IS A LOGGED IN USER
    // We can send the user to the frontend using res.locals
    res.locals.user = currentUser;
    // req.user = currentUser;
    return next();
  }
  next();
});

// Makes sure the user has the right role to be able to process the request.
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random token

  const resetToken = user.createPasswordResetToken();

  // this is needed since we don't send an object with all the necessary fields
  // to the save method, but still want to be able to use pre-hooks
  await user.save({ validateBeforeSave: false });

  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  // we would like to do more than just throw an error

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired , and there is user, set the new password

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) Update changedPasswordAt property for the user (done in a save pre-hook)

  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the collection

  // req.user is available to use since this function runs after protect, as
  // specified in the router.
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct

  if (!user || !(await user.correctPassword(req.body.passwordCurrent))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) If so, update password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // User.findByIdAndUpdate will NOT work as intended!

  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

// Check that the user is allowed to change this review, that is, they are the
// some user who posted the review or an admin.
exports.checkIfUser = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('No doc found with that ID', 404));
  }
  if (!(req.user.role === 'admin' || review.user.id === req.user.id)) {
    return next(new AppError("You cannot update some else's review.", 403));
  }
  next();
});
