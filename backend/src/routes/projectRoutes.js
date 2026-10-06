const express = require('express');

const {
    createProject,
    getMyProjects,
    getAllProjects,
    getOpenProjects,
    searchProjects,
    getProjectById,
    updateProject,
    cancelProject
} = require('../controllers/project/projectController');

const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
    '/',
    authMiddleware,
    requireRole('CLIENT'),
    createProject
);

// All projects
router.get(
    '/',
    authMiddleware,
    requireRole('FREELANCER'),
    getAllProjects
);

// Only projects currently accepting applications
router.get(
    '/open',
    authMiddleware,
    requireRole('FREELANCER'),
    getOpenProjects
);

router.get(
    '/my',
    authMiddleware,
    requireRole('CLIENT'),
    getMyProjects
);
// Search and filter open projects
router.get(
    '/search',
    authMiddleware,
    requireRole('FREELANCER'),
    searchProjects
);

router.get(
    '/:id',
    authMiddleware,
    getProjectById
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