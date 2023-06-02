const express = require('express');

const {
    getReview, getReviews, addReview, updateReview, deleteReview }
    = require('../controllers/reviews');

const { protect, authorize } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(getReviews)
    .post(protect, authorize('user', 'admin'), addReview);

router.route('/:id')
    .get(getReview)
    .put(protect, authorize('user', 'admin'), updateReview)
    .delete(protect, authorize('user', 'admin'), deleteReview);

module.exports = router;