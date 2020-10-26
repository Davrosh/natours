/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51HflR7Cb2crGjsnDRgHtgPUEfTwo9WIYI3YPf0KxF6nJMIfxQLa1XApH6qRnLQ43s2yRBOZiaZuoNXqDO3WZGnSK00l6J1aMqf'
  );
  try {
    // 1) Get checkout session from API

    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    // console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    // console.log(err);
    showAlert('error', err);
  }
};
