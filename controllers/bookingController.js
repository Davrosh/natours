const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour

  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
        ],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This is only TEMPORARY, because it's INSECURE: everyone can make bookings
//   // without paying
//   const { tour, user, price } = req.query;
//   if (!tour || !user || !price) {
//     return next();
//   }
//   await Booking.create({ tour, user, price });

//   // calling next(); here would leave the url with the sensitive query data. We
//   // instead redirect (issue a new request) to the homepage url, so the next
//   // function to be called is the current one, only this time the three
//   // variables above will be undefined and we will continue onto the next
//   // middleware.
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.display_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};

// This is a solution to a problem with the old exports.createBookingCheckout
// that allows a user to copy the url with the query string used in the old
// method and run it in the browser which invokes the booking function without
// ever paying.
// Stripe itself sends a POST request to a special route upon successful
// payment (it is 'checkout.session.completed' - we've configured it ahead of
// time in our Sprite Webhook dashboard), invoking this function which will book
// the tour using data received from the session that Stripe sends back.
exports.webhookCheckout = async (req, res, next) => {
  // Stripe gives us this header.
  const signature = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      await createBookingCheckout(event.data.object);
    }

    // send Stripe a message back.
    res.status(200).json({ received: true });
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
