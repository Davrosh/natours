const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protects all routes after this middleware - middleware functions run in
// sequence
router.use(authController.protect);

router.patch(
  '/updateMyPassword',
  /*authController.protect,*/
  authController.updatePassword
);

router.get(
  '/me',
  /*authController.protect,*/
  userController.getMe,
  userController.getUser
);
router.patch(
  '/updateMe',

  /*authController.protect,*/
  userController.uploadUserPhoto,
  (req, res, next) => {
    console.log(req.file.buffer.toString('base64'));
    next();
  },
  // Now, thanks to multer, req.file will hold
  // the uploaded file info - buffer is the file itself.
  // The body-parser middleware does not know how to parse multipart - the way
  // we send files in requests, but multer does.

  userController.cloudinaryUpload,
  /*userController.resizeUserPhoto,*/
  userController.updateMe
);
router.delete('/deleteMe', /*authController.protect,*/ userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
