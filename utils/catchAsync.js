// Wraps around an async function and provides a standard way of catching raised
// exceptions (removes the need for a simple try-catch block inside async
// function).
// catch the error and pass it onto next: catch(err => next(next))
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
    // fn(req, res, next).catch((err) => {
    //   next(err);
    // });
  };
};
