/* eslint-disable */
import '@babel/polyfill';
//import dotenv from 'dotenv';
import getCloudinaryUrl from './../../utils/getCloudinaryUrl';
// import { Cloudinary } from 'cloudinary-core';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alerts';

//dotenv.config({ path: './../../.env' });


// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');

const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

// if (userDataForm) {
//   userDataForm.addEventListener('submit', (e) => {
//     e.preventDefault();
//     // This is needed in order to send files.
//     const form = new FormData();
//     form.append('name', document.getElementById('name').value)
//     form.append('email', document.getElementById('email').value)
//     form.append('photo', document.getElementById('photo').files[0])

//     // console.log(form);
//     // const name = document.getElementById('name').value;
//     // const email = document.getElementById('email').value;
//     // updateSettings({ name, email }, 'data');

//     updateSettings(form, 'data');
//   });
// }

if (userDataForm) {
  const elemUpload = userDataForm.querySelector('.form__upload');
  const elemUserPhoto = userDataForm.querySelector('.form__user-photo');

  // whenever the user selects a photo, we change the one displayed to the one
  // they've selected.
  elemUpload.addEventListener('change', (e) => {
    const file = document.getElementById('photo').files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      elemUserPhoto.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });

  userDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // This is needed in order to send files.
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    document.querySelector('.btn--save-settings').textContent = 'Updating...';

    // console.log(form);
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    // updateSettings({ name, email }, 'data');

    const res = await updateSettings(form, 'data');
    document.querySelector('.btn--save-settings').textContent = 'Save settings';

    const user = res.data.data.user;

    let image;
    // IMPORTANT: this code reoccurs throughout the app - here and in the pug
    // templates. 
    // remoteSaved is a value on the user model. It is undefined for 'legacy
    // users', or rather users who have their profile pic in the img/users
    // folder. Users who change their profile pics from now on will have them
    // served from Cloudinary and their remoteSaved entry set to 'true'.
    // This feature was meant to bypass the Heroku platform deleting profile
    // pics uploaded to their servers.
    if (user.remoteSaved) {
      image = getCloudinaryUrl(user);
    }

    //change user photo without reloading the page.
    elemUserPhoto.src = user.remoteSaved ? image : `img/users/${user.photo}`;
    document.querySelector('.nav__user-img').src = user.remoteSaved
      ? image
      : `img/users/${user.photo}`;
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    // data-tour-id gets automatically converted to dataset.tourId
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) {
  showAlert('success', alertMessage, 20);
}
