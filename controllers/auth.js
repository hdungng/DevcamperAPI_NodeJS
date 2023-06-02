const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const cryto = require('crypto');

// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Create User
        const user = await User.create({
            name,
            email,
            password,
            role
        });

        // Create token
        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
}



// @desc    Login User
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // ====== VALIDATE EMAIL & PASSWORD  ==============


        // 1. check if email and password are empty (blank field)
        if (!email || !password)
            return next(new ErrorResponse("Please provide email & password", 400));

        // 2. check user
        const user = await User.findOne({ email }).select('+password');

        // 3. Make sure user exists in DB
        if (!user)
            return next(new ErrorResponse("Your email has not registered yet", 401));

        // 4. check if password matches 
        const isMatch = await user.matchPassword(password);

        if (!isMatch)
            return next(new ErrorResponse("Your password is not correct", 401))

        // 5. Create token
        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
}

// @desc    GET current User
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async function (req, res, next) {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
}


// @desc    Logout users
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async function (req, res, next) {
    try {
        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
        });
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Update details of the current user
// @route   PUT /api/v1/auth/update-detail
// @access  Private
exports.updateDetail = async function (req, res, next) {
    try {
        const updateUser = {
            email: req.body.email,
            name: req.body.name
        }

        const user = await User.findByIdAndUpdate(req.user.id, updateUser, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        })
    } catch (err) {
        next(err);
    }
}


// @desc    Update password 
// @route   PUT /api/v1/auth/update-password
// @access  Private
exports.updatePassword = async function (req, res, next) {
    try {
        const user = await User.findById(req.user.id).select('+password');

        // check current password => is correct ?
        if (!(await user.matchPassword(req.body.currentPassword))) {
            return next(new ErrorResponse("Your password is not correct", 401));
        }

        // Correct => set new password
        user.password = req.body.newPassword;

        await user.save();

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async function (req, res, next) {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user)
            return next(new ErrorResponse("There is no user with that email", 404));

        // Get a reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of the password. Please make a PUT request to: \n\n ${resetUrl}`;

        try {

            await sendEmail({
                email: user.email,
                subject: 'Password reset token',
                message
            });

            res.status(200).json({
                success: true,
                data: 'Email sent'
            })
        } catch (err) {
            console.log(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return next(new ErrorResponse('Reset email could not be sent', 500));
        }
    } catch (err) {
        next(err);
    }
}


// @desc    Reset Password
// @route   PUT /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = async function (req, res, next) {
    try {
        // Get Hash Token
        const resetPasswordToken = cryto.createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const user = await User.findOne(
            {
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() }
            });

        if (!user)
            return next(new ErrorResponse('Invalid token or token expired', 400));

        // Set a new password
        user.password = req.body.password;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
}

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // create Token
    const token = user.getSignedJwtToken();

    // ~~~ * 1000 (s)  * 60 (m) * 60 (h) * 24 (h) = 1 day
    const options = {
        expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000)),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production')
        options.secure = true;

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            'success': true,
            token
        });
}