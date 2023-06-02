const mongoose = require('mongoose');


const ReviewSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a Review title']
    },
    text: {
        type: String,
        required: [true, 'Please add a review']
    },
    rating: {
        type: Number,
        required: [true, 'Please rating from 0 to 10'],
        min: [1, 'Rating must be at least 1'],
        max: [10, 'Rating cannot be more than 10']
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    bootcamp: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bootcamp',
        required: true
    }, 
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
});

// Prevent user from submitting more than one review per bootcamp
// ===>  1 USER - 1 REVIEW (/ BOOTCAMP)
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });


ReviewSchema.statics.getAverageRating = async function (bootcampId) {
    const obj = await this.aggregate([
        {
            $match: { bootcamp: bootcampId }
        }, {
            $group: {
                _id: '$bootcamp',
                averageRating: { $avg: '$rating' }
            }
        }
    ]);

    try {
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageRating: obj[0].averageRating
        });
    } catch (err) {
        console.error(err);
    }
}


// getAverageRating after Save
ReviewSchema.post('save', async function () {
    await this.constructor.getAverageRating(this.bootcamp);
});


// getAverageRating after Remove
ReviewSchema.post('remove', async function () {
    await this.constructor.getAverageRating(this.bootcamp);
});

module.exports = mongoose.model('Review', ReviewSchema);