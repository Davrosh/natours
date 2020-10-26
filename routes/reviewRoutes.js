const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// This allows this router access to params from previous routers, like tourId.
const router = express.Router({ mergeParams: true });

// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews
// POST reviews

router.use(authController.protect);

router.route('/').get(reviewController.getAllReviews).post(
  /*authController.protect,*/
  authController.restrictTo('user'),
  reviewController.setTourUserIds,
  reviewController.createReview
);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    authController.checkIfUser,
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    authController.checkIfUser,
    reviewController.deleteReview
  );

// router.get('/getReview/:id', reviewController.getReview);

module.exports = router;
