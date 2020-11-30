const mongoose = require('mongoose');

const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);

  process.exit(1);
});

dotenv.config({ path: './.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    // .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful'));
// .catch((err) => console.log('ERROR'));

// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('Error: ☝', err);
//   });

// console.log(process.env);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');

  const fullMessage = err.message;
  const prefix = 'MongoError: ';
  const errmsgStart = fullMessage.indexOf(prefix) + prefix.length;
  const errmsgStop = fullMessage.indexOf('.', errmsgStart) + 1;
  const errmsgLen = errmsgStop - errmsgStart;
  const errorText = fullMessage.substr(errmsgStart, errmsgLen);

  console.log(err.name, errorText);

  server.close(() => {
    process.exit(1);
  });
});

// Respond to a SIGTERM - Heroku sends this to our app once every 24 hours, when
// that happens we need to shut down gracefully and handle all previous requests
// using server.close() instead of terminating abruptly.
process.on('SIGTERM', () => {
  console.log('☕ Shutting down gracefully...');
  server.close(() => {
    console.log('⛄ Process terminated!');
  });
});

// console.log(x);
