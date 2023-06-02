const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');


// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private

exports.getUsers = async (req, res, next) => {
    try {
        res.status(200).json(res.advancedResults);
    } catch (err) {
        next(err);
    }
}


// @desc    Get user by id
// @route   GET /api/v1/admin/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);


        if (!user) {
            return next(new ErrorResponse(`ID Not Found: User Not Found with ID of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (err) {
        next(err);
    }
}

// @desc    Create new User
// @route   POST /api/v1/users
// @access  Private
exports.createUser = async (req, res, next) => {
    try {
        const user = await User.create(req.body);

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
}


// @desc    Update User
// @route   PUT /api/v1/admin/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return next(new ErrorResponse(`ID Not Found: User Not Found with ID of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: user
        })
    } catch (err) {
        next(err);
    }
}


// @desc    Delete User
// @route   Delete /api/v1/admin/users/:id
// @access  Private
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return next(new ErrorResponse(`ID Not Found: User Not Found with ID of ${req.params.id}`, 404));
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        })
    } catch (err) {
        next(err);
    }
}