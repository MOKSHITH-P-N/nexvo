const express = require('express');

const {
    startAssessment
} = require('../controllers/assessment/assessmentStartController');

const {
    saveAssessmentAnswer
} = require('../controllers/assessment/assessmentAnswerController');

const {
    submitAssessment
} = require('../controllers/assessment/assessmentSubmitController');

const {
    getAssessmentResult,
    getAssessmentHistory
} = require('../controllers/assessment/assessmentResultController');

const {
    recordAssessmentViolation
} = require('../controllers/assessment/assessmentViolationController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();
router.post(
    '/start',
    authMiddleware,
    requireRole('FREELANCER'),
    startAssessment
);
router.put(
    '/:id/answers',
    authMiddleware,
    requireRole('FREELANCER'),
    saveAssessmentAnswer
);
router.post(
    '/:id/submit',
    authMiddleware,
    requireRole('FREELANCER'),
    submitAssessment
);

router.get(
    '/:id',
    authMiddleware,
    getAssessmentResult
);
router.get('/', authMiddleware, getAssessmentHistory);
router.post(
    '/:id/violations',
    authMiddleware,
    recordAssessmentViolation
);
module.exports = router;