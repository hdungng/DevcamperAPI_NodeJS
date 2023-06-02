const express = require('express');
const { register, login, getMe,
    forgotPassword, resetPassword,
    updateDetail, updatePassword, logout } = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middlewares/auth');

router.route('/register')
    .post(register);

router.route('/logout')
    .get(logout);


router.route('/login')
    .post(login);

router.route('/me')
    .get(protect, getMe);

router.route('/forgot-password')
    .post(forgotPassword);

router.route('/update-detail')
    .put(protect, updateDetail);

router.route('/update-password')
    .put(protect, updatePassword);

router.route('/reset-password/:resetToken')
    .put(resetPassword);

module.exports = router;