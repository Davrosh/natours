//const cloudinary = require('cloudinary').v2;
const { Cloudinary } = require('cloudinary-core');

// IMPORTANT: the Parcel bundler will only let us reference env variables in the
// frontend (like we're doing here when calling this function from the frontend)
// if the environment file is called for instance '.env' and not 'config.env' as
// it was called initially.

// It turns out you can write this code down with both the 'cloudinary' backend
// package or the 'cloudinary-core' frontend package. The only reason for
// choosing one over the other is that for some reason the frontend code doesn't
// like us requiring the cloudinary package and we are using it to retrieve the
// url in both front and back.
module.exports = (doc) => {
  // split with respect to the first '/'
  const [version, url] = doc.photo.split(/\/(.+)/);

  // console.log(version, url);
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  // console.log(cloudName);
  const cl = new Cloudinary({
    cloud_name: cloudName,
  });

  // fetch the version of the file specified on upload.
  // this further transforms the file to have automatic quality and file format
  // served.
  return cl.url(url, {
    transformation: [
      { width: 500, height: 500, gravity: 'faces', crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    secure: true,
    version,
  });
};

// module.exports = (doc) => {
//   // split with respect to the first '/'
//   const [version, url] = doc.photo.split(/\/(.+)/);
//   //console.log(version, url);
//   return cloudinary.url(url, {
//     transformation: [
//       { width: 500, height: 500, gravity: 'faces', crop: 'fill' },
//       { quality: 'auto', fetch_format: 'auto' },
//     ],
//     secure: true,
//     version: version,
//   });
// };
