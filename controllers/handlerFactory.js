const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Helper function for filtering an existing object for the specified fields.
const filterObj = (obj, allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model, updateFields) =>
  // We would like to only be able to edit certain fields.
  catchAsync(async (req, res, next) => {
    let filteredBody;
    if (updateFields) {
      filteredBody = filterObj(req.body, updateFields);
    } else {
      filteredBody = req.body;
    }
    // run validators for updated fields but don't run pre-hooks/validators for
    // other fields
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      /*req.body*/ filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    const modelName = Model.modelName.toLowerCase();

    res.status(200).json({
      status: 'success',
      data: {
        [modelName]: doc,
      },
    });
  });

exports.createOne = (Model, updateFields) =>
  catchAsync(async (req, res, next) => {
    let filteredBody;
    if (updateFields) {
      filteredBody = filterObj(req.body, updateFields);
    } else {
      filteredBody = req.body;
    }
    const doc = await Model.create(/*req.body*/ filteredBody);

    const modelName = Model.modelName.toLowerCase();

    res.status(201).json({
      status: 'success',
      data: {
        [modelName]: doc,
      },
    });

    // try {
    //   // const newTours = new Tour({
    //   // })
    //   // newTours.save()

    // } catch (err) {
    //   res.status(400).json({
    //     status: 'fail',
    //     message: err,
    //   });
    // }
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;
    // Tour.findOne({ _id: req.params.id })

    //   console.log(req.params);
    // const id = req.params.id * 1;
    // const tour = tours.find((el) => el.id === id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });

    // try {

    // } catch (err) {
    //   res.status(404).json({
    //     status: 'fail',
    //     message: err,
    //   });
    // }
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    // console.log(req.query);

    // BUILD QUERY
    // console.log(req.requestTime);

    // 1A) FILTERING

    // // creates a new object based on req.query
    // const queryObj = { ...req.query };
    // const excludeFields = ['page', 'sort', 'limit', 'fields'];

    // excludeFields.forEach((el) => delete queryObj[el]);

    // console.log(req.query, queryObj);

    // // 1B) Advanced filtering

    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // console.log(JSON.parse(queryStr));

    // // { difficulty: "easy", duration: { $gte: 5 }}
    // // { difficulty: 'easy', duration: { gte: '5' }}

    // // gte, gt, lte, lt
    // let query = Tour.find(JSON.parse(queryStr));

    // 2) Sorting

    // if (req.query.sort) {
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   console.log(sortBy);
    //   query = query.sort(sortBy);
    //   // sort('price ratingsAverage')
    // } else {
    //   query = query.sort('-createdAt');
    // }

    // 3) field limiting

    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v');
    // }

    // 4) Pagination
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;

    // // page=2&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3
    // query = query.skip(skip).limit(limit);

    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) {
    //     throw new Error('This page does not exist');
    //   }
    // }

    // EXECUTE THE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;
    // query.sort().select().skip().limit()

    // const query = Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // SEND RESPONSE

    res.status(200).json({
      status: 'success',
      // requestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });

    // try {

    // } catch (err) {
    //   res.status(404).json({
    //     status: 'fail',
    //     message: err.message,
    //   });
    // }
  });
