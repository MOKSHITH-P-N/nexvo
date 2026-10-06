const express = require('express');

const {
    createProfile,
    getProfile,
    updateProfile
} = require('../controllers/freelancer/freelancerProfileController');
const {
    addSkills,
    getSkills,
    deleteSkill
} = require('../controllers/freelancer/freelancerSkillController');

const {
    addEducation,
    getEducation,
    getEducationById,
    updateEducation,
    deleteEducation
} = require('../controllers/freelancer/freelancerEducationController');

const {
    addExperience,
    getExperience,
    getExperienceById,
    updateExperience,
    deleteExperience
} = require('../controllers/freelancer/freelancerExperienceController');

const {
    addPortfolioProject,
    getPortfolioProjects,
    getPortfolioProject,
    updatePortfolioProject,
    deletePortfolioProject
} = require('../controllers/freelancer/freelancerPortfolioController');

const {
    addCertificate,
    getCertificates,
    getCertificateById,
    updateCertificate,
    deleteCertificate
} = require('../controllers/freelancer/freelancerCertificateController');

const {
    addInternship,
    getInternships,
    getInternshipById,
    updateInternship,
    deleteInternship
} = require('../controllers/freelancer/freelancerInternshipController');

const {
    addHackathon,
    getHackathons,
    getHackathonById,
    updateHackathon,
    deleteHackathon
} = require('../controllers/freelancer/freelancerHackathonController');

const {
    addOpenSource,
    getOpenSource,
    getOpenSourceById,
    updateOpenSource,
    deleteOpenSource
} = require('../controllers/freelancer/freelancerOpenSourceController');

const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
    '/profile',
    authMiddleware,
    requireRole('FREELANCER'),
    createProfile
);
router.get(
    '/profile',
    authMiddleware,
    requireRole('FREELANCER'),
    getProfile
);

router.patch(
    '/profile',
    authMiddleware,
    requireRole('FREELANCER'),
    updateProfile
);

router.post(
    '/skills',
    authMiddleware,
    requireRole('FREELANCER'),
    addSkills
);
router.get(
    '/skills',
    authMiddleware,
    requireRole('FREELANCER'),
    getSkills
);

router.delete(
    '/skills/:skillId',
    authMiddleware,
    requireRole('FREELANCER'),
    deleteSkill
);

router.post(
    '/education',
    authMiddleware,
    requireRole('FREELANCER'),
    addEducation
);
router.get(
    '/education',
    authMiddleware,
    requireRole('FREELANCER'),
    getEducation
);

router.get(
    '/education/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    getEducationById
);

router.patch(
    '/education/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    updateEducation
);

router.delete(
    '/education/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    deleteEducation
);

router.post(
    '/experience',
    authMiddleware,
    requireRole('FREELANCER'),
    addExperience
);
router.get(
    '/experience',
    authMiddleware,
    requireRole('FREELANCER'),
    getExperience
);

router.get(
    '/experience/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    getExperienceById
);

router.patch(
    '/experience/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    updateExperience
);

router.delete(
    '/experience/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    deleteExperience
);

router.post(
    '/portfolio',
    authMiddleware,
    requireRole('FREELANCER'),
    addPortfolioProject
);

router.get(
    '/portfolio',
    authMiddleware,
    requireRole('FREELANCER'),
    getPortfolioProjects
);

router.get(
    '/portfolio/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    getPortfolioProject
);

router.patch(
    '/portfolio/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    updatePortfolioProject
);

router.delete(
    '/portfolio/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    deletePortfolioProject
);

router.post(
    '/certificates',
    authMiddleware,
    requireRole('FREELANCER'),
    addCertificate
);

router.get(
    '/certificates',
    authMiddleware,
    requireRole('FREELANCER'),
    getCertificates
);

router.get(
    '/certificates/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    getCertificateById
);

router.patch(
    '/certificates/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    updateCertificate
);

router.delete(
    '/certificates/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    deleteCertificate
);

router.post(
    '/internships',
    authMiddleware,
    requireRole('FREELANCER'),
    addInternship
);

router.get(
    '/internships',
    authMiddleware,
    requireRole('FREELANCER'),
    getInternships
);

router.get(
    '/internships/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    getInternshipById
);

router.patch(
    '/internships/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    updateInternship
);

router.delete(
    '/internships/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    deleteInternship
);
router.post(
    '/hackathons',
    authMiddleware,
    requireRole('FREELANCER'),
    addHackathon
);

router.get(
    '/hackathons',
    authMiddleware,
    requireRole('FREELANCER'),
    getHackathons
);

router.get(
    '/hackathons/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    getHackathonById
);

router.patch(
    '/hackathons/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    updateHackathon
);

router.delete(
    '/hackathons/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    deleteHackathon
);

router.post(
    '/open-source',
    authMiddleware,
    requireRole('FREELANCER'),
    addOpenSource
);

router.get(
    '/open-source',
    authMiddleware,
    requireRole('FREELANCER'),
    getOpenSource
);

router.get(
    '/open-source/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    getOpenSourceById
);

router.patch(
    '/open-source/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    updateOpenSource
);

router.delete(
    '/open-source/:id',
    authMiddleware,
    requireRole('FREELANCER'),
    deleteOpenSource
);

module.exports = router;