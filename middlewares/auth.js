const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');


// Protect Routes

exports.protect = async function (req, res, next) {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else if(req.cookies.token) {
            token = req.cookies.token
        }

        // Make sure token is Exists
        if (!token)
            return next(new ErrorResponse("Not authorize to access this route", 401));

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id);

            next();
        } catch (err) {
            return next(new ErrorResponse("Not authorize to access this route", 401));
        }
    } catch (err) {
        console.error(err);
    }
}


// Grant access to specific role
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role))
            return next(new ErrorResponse(`[User role]: ${req.user.role} is not authorized to access this route`, 403));

        next();
    }
}