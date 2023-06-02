const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
    let error = { ...err } 

    error.message = err.message;

    // Log to the console for dev
    console.log(err);


    // Mongoose Bad Object_ID
    if(err.name === 'CastError') {
        const message = `Invalid ID Error:Not Found `;
        error = new ErrorResponse(message, 404);
    }

    // Duplicate Validation
    if(err.code === 11000) {
        const message = `Duplicate Error: Duplicate field ${Object.keys(err.keyValue)}`;
        error = new ErrorResponse(message, 400);
    }

    // Mongoose Validation Error
    if(err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
}

module.exports = errorHandler;