const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
// const bookingController = require('../controllers/bookingController');

const router = express.Router();

// How do we pass information to the front-end? Notice how each route starts
// with either isLoggedIn or protect which set res.locals fields like user which
// the front-end can then access in that request.

// We implement a reusable solution where we pass information to the front end
// via the query string, which we can then use to display certain messages in
// the front-end javascript code.
router.use(viewsController.alerts);

// router.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'Jonas',
//   });
// });

// when receiving a successful payment for a tour, we are redirected to the
// homepage and that is the point in time where we want to create a new booking.
// This workaround is no longer needed after migrating to the Stripe Webhook
// solution.
router.get(
  '/',
  // bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

// /login

router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);
module.exports = router;
