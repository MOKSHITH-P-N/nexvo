const express = require('express');

const {
    createProject,
    getMyProjects,
    getProjectById,
    updateProject,
    cancelProject
} = require('../controllers/projectController');

const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
    '/',
    authMiddleware,
    requireRole('CLIENT'),
    createProject
);
router.get(
    '/:id',
    authMiddleware,
    getProjectById
);
router.get(
    '/my',
    authMiddleware,
    requireRole('CLIENT'),
    getMyProjects
);
router.put(
    '/:id',
    authMiddleware,
    requireRole('CLIENT'),
    updateProject
);
router.patch(
    '/:id/cancel',
    authMiddleware,
    requireRole('CLIENT'),
    cancelProject
);


module.exports = router;