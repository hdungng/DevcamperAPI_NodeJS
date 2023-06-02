const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const geocoder = require('../utils/geocoder');

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = async (req, res, next) => {
    try {
        res.status(200).json(res.advancedResults);
    } catch (err) {
        next(err);
    }
}

// @desc    Get single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.findById(req.params.id);


        if (!bootcamp) {
            return next(new ErrorResponse(`ID Not Found: Bootcamp Not Found with ID of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: bootcamp
        })
    } catch (err) {
        // res.status(400).json({
        //     success: false
        // })
        next(err);
    }
}


// @desc    Create new bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
exports.createBootcamp = async (req, res, next) => {
    try {
        req.body.user = req.user.id;

        const userBootcamp = await Bootcamp.findOne({ user: req.user.id });

        if (userBootcamp && req.user.role !== 'admin')
            return next(new ErrorResponse(`${req.user.role} has only created once`, 403));


        const bootcamp = await Bootcamp.create(req.body);

        res.status(201).json({
            success: true,
            data: bootcamp
        })
    } catch (err) {
        next(err);
    }
}


// @desc    Update bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!bootcamp) {
            return next(new ErrorResponse(`ID Not Found: Bootcamp Not Found with ID of ${req.params.id}`, 404));
        }

        if (bootcamp.user !== req.user.id)
            return next(new ErrorResponse(`This bootcamp is owned by User ${req.user.id}`, 401));

        res.status(200).json({
            success: true,
            data: bootcamp
        })
    } catch (err) {
        next(err);
    }
}


// @desc    Delete bootcamp
// @route   Delete /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.findById(req.params.id);

        if (!bootcamp) {
            return next(new ErrorResponse(`ID Not Found: Bootcamp Not Found with ID of ${req.params.id}`, 404));
        }

        if (bootcamp.user.toString() !== req.user.id)
            return next(new ErrorResponse(`This bootcamp is owned by User ${req.user.id}`, 401));

        await bootcamp.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        })
    } catch (err) {
        next(err);
    }
}


// @desc    Get bootcamp wwith the Radius
// @route   Get /api/v1/bootcamps/radius/:zipcode/:distance
// @access  Private
exports.getBootcampInRadius = async (req, res, next) => {
    try {
        const { zipcode, distance } = req.params;

        // Get lat/lng from geocoder
        const loc = await geocoder.geocode(zipcode);
        const lat = loc[0].latitude;
        const lng = loc[0].longitude;

        // Calc radius using radians
        // Divide distance by radius of Earth
        // Earth Radius = 3.963 mi / 6.378 km
        const radius = distance / 3963;

        const bootcamps = await Bootcamp.find({
            location: {
                $geoWithin: {
                    $centerSphere: [
                        [lng, lat],
                        radius
                    ]
                }
            }
        });

        if (bootcamp.user !== req.user.id)
            return next(new ErrorResponse(`This bootcamp is owned by User ${req.user.id}`, 401));

        res.status(200).json({
            success: true,
            count: bootcamps.length,
            data: bootcamps
        })
    } catch (err) {
        next(err);
    }
}




// @desc    Upload photo for bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
exports.bootcampPhotoUpload = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.findById(req.params.id);

        if (!bootcamp) {
            return next(new ErrorResponse(`ID Not Found: Bootcamp Not Found with ID of ${req.params.id}`, 404));
        }

        if (!req.files) {
            return next(new ErrorResponse(`Please upload a file`, 400));
        }

        const file = req.files.file;

        // Make sure the image is photo
        if (!file.mimetype.startsWith('image')) {
            return next(new ErrorResponse(`Please upload an image file`, 400));
        }

        // Check filesize
        if (file.size > process.env.MAX_FILE_UPLOAD) {
            return next(
                new ErrorResponse(
                    `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
                    400
                )
            );
        }

        // Create custom filename
        file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

        file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
            if (err) {
                console.error(err);
                return next(new ErrorResponse(`Problem with file upload`, 500));
            }

            await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

            res.status(200).json({
                success: true,
                data: file.name
            });
        });

    } catch (err) {
        next(err);
    }
}