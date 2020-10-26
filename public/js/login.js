/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    // If we are able to login the user, transfer them to the homepage after
    // 1.5 seconds (we need to reload the page in order for the changes to
    // take effect).
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
    try{
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout',
        });

        if (res.data.status === 'success') {
            // Reload the page and not from the cache which might still hold our
            // user menu.
            // location.reload(true);
            window.location.replace('/');
        }
    } catch(err) {
        showAlert('error', 'Error logging out! Try again!')
    }
}