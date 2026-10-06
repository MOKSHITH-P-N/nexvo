const express = require('express');

const {
    getEducationLevels
} = require('../controllers/educationLevelController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
    '/',
    authMiddleware,
    getEducationLevels
);

module.exports = router;