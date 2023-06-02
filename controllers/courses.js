const Bootcamp = require('../models/Bootcamp');
const Course = require('../models/Course');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// @access  Public

exports.getCourses = async (req, res, next) => {
    try {

        if (req.params.bootcampId) {
            const courses = await Course.find({ bootcamp: req.params.bootcampId });

            return res.status(200).json({
                success: true,
                count: courses.length,
                data: courses
            });
        } else {
            res.status(200).json(res.advancedResults);
        }


        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (err) {
        next(err);
    }
}


// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @access  Public
exports.getCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id).populate({
            path: 'bootcamp',
            select: 'name description'
        });


        if (!course) {
            return next(new ErrorResponse(`ID Not Found: Course Not Found with ID of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: course
        })
    } catch (err) {
        next(err);
    }
}


// @desc    Add Course
// @route   POST /api/v1/bootcamps/:bootcampId/courses
// @access  Private
exports.addCourse = async (req, res, next) => {
    try {
        req.body.bootcamp = req.params.bootcampId;
        req.body.user = req.user.id;

        const bootcamp = await Bootcamp.findById(req.params.bootcampId);
        const userCourse = await Course.findOne({ user: req.user.id });

        if (!bootcamp) {
            return next(new ErrorResponse(`ID Not Found: Bootcamp Not Found with ID of ${req.params.id}`, 404));
        }

        if (userCourse && req.user.role !== 'admin')
            return next(new ErrorResponse(`${req.user.role} has only created once`, 403));


        const course = await Course.create(req.body);

        res.status(201).json({
            success: true,
            data: course
        })
    } catch (err) {
        next(err);
    }
}

// @desc    Update Course
// @route   PUT /api/v1/Courses/:id
// @access  Private
exports.updateCourse = async (req, res, next) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!course) {
            return next(new ErrorResponse(`ID Not Found: Course Not Found with ID of ${req.params.id}`, 404));
        }

        if (course.user !== req.user.id)
            return next(new ErrorResponse(`This course is owned by User ${req.user.id}`, 401));

        res.status(200).json({
            success: true,
            data: course
        })
    } catch (err) {
        next(err);
    }
}

// @desc    Delete course
// @route   Delete /api/v1/courses/:id
// @access  Private
exports.deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return next(new ErrorResponse(`ID Not Found: Course Not Found with ID of ${req.params.id}`, 404));
        }

        if (course.user.toString() !== req.user.id)
            return next(new ErrorResponse(`${req.user.id} This course is owned by User ${course.user}`, 401));


        course.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
}