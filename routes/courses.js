const express = require('express');

const {
    getCourses, getCourse, addCourse, updateCourse, deleteCourse }
    = require('../controllers/courses');

const { protect, authorize } = require('../middlewares/auth');
const advancedResults = require('../middlewares/advancedResults');
const Course = require('../models/Course');

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(advancedResults(Course, 'bootcamp'), getCourses)
    .post(protect, authorize('publisher', 'admin'), addCourse);

router.route('/:id')
    .get(getCourse)
    .put(protect, authorize('publisher', 'admin'), updateCourse)
    .delete(protect, authorize('publisher', 'admin'), deleteCourse);

module.exports = router;