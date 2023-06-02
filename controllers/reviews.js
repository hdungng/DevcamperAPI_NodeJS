const Bootcamp = require('../models/Bootcamp');
const Review = require('../models/Review');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all Reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/bootcamps/:bootcampId/reviews
// @access  Public

exports.getReviews = async (req, res, next) => {
    try {
        let query;

        if (req.params.bootcampId) {
            query = Review.find({ bootcamp: req.params.bootcampId });
        } else {
            query = Review.find();
        }

        const reviews = await query;

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (err) {
        next(err);
    }
}


// @desc    Get single Review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id).populate({
            path: 'bootcamp',
            select: 'name description'
        });


        if (!review) {
            return next(new ErrorResponse(`ID Not Found: Review Not Found with ID of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: review
        })
    } catch (err) {
        next(err);
    }
}


// @desc    Add Review
// @route   POST /api/v1/bootcamps/:bootcampId/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
    try {
        req.body.bootcamp = req.params.bootcampId;
        req.body.user = req.user.id;

        const bootcamp = await Bootcamp.findById(req.params.bootcampId);

        if (!bootcamp) {
            return next(new ErrorResponse(`ID Not Found: Bootcamp Not Found with ID of ${req.params.id}`, 404));
        }

        const review = await Review.create(req.body);

        res.status(201).json({
            success: true,
            data: review
        })
    } catch (err) {
        next(err);
    }
}

// @desc    Update Review
// @route   PUT /api/v1/Reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
    try {
        let review = await Review.findById(req.params.id);

        if (!review) {
            return next(new ErrorResponse(`ID Not Found: Review Not Found with ID of ${req.params.id}`, 404));
        }

        if (review.user.toString() !== req.user.id && req.user.role !== 'admin')
            return next(new ErrorResponse(`This Review is owned by User ${review.user}`, 401));

        review = await Review.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: review
        })
    } catch (err) {
        next(err);
    }
}

// @desc    Delete Review
// @route   Delete /api/v1/Reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return next(new ErrorResponse(`ID Not Found: Review Not Found with ID of ${req.params.id}`, 404));
        }

        if (review.user.toString() !== req.user.id  && req.user.role !== 'admin')
            return next(new ErrorResponse(`${req.user.id} This Review is owned by User ${Review.user}`, 401));


        await review.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
}