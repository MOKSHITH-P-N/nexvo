const express = require('express');

const {
    applyToProject,
    getMyApplications,
    getProjectApplications,
    updateApplicationStatus
} = require('../controllers/application/applicationController');

const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();


// FREELANCER
router.post(
    '/:projectId',
    authMiddleware,
    requireRole('FREELANCER'),
    applyToProject
);

router.get(
    '/my',
    authMiddleware,
    requireRole('FREELANCER'),
    getMyApplications
);


// CLIENT
router.get(
    '/project/:projectId',
    authMiddleware,
    requireRole('CLIENT'),
    getProjectApplications
);
router.patch(
    '/:applicationId/status',
    authMiddleware,
    requireRole('CLIENT'),
    updateApplicationStatus
);


module.exports = router;