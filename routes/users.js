const express = require('express');
const { getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser } = require('../controllers/users');

const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');


router.route('/')
    .get(protect, authorize('admin'), getUsers)
    .post(protect, authorize('admin'), createUser);

router.route('/:id')
    .get(getUser)
    .put(protect, authorize('admin'), updateUser)
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;