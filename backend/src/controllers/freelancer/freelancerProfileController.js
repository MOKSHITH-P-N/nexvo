const pool = require('../../config/db');

const {
    recalculateCandidateScores
} = require('../../services/freelancerScoreService');


// CREATE FREELANCER PROFILE
const createProfile = async (req, res) => {
    try {
        const {
            bio,
            years_experience,
            github_url
        } = req.body;

        if (
            years_experience !== undefined &&
            (
                Number.isNaN(Number(years_experience)) ||
                Number(years_experience) < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Years of experience must be a non-negative number'
            });
        }

        const [existingProfile] = await pool.execute(
            `SELECT id
             FROM freelancer_profiles
             WHERE user_id = ?`,
            [req.user.id]
        );

        if (existingProfile.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Freelancer profile already exists'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO freelancer_profiles
             (
                user_id,
                bio,
                years_experience,
                github_url
             )
             VALUES (?, ?, ?, ?)`,
            [
                req.user.id,
                bio ?? null,
                years_experience ?? 0,
                github_url ?? null
            ]
        );

        // Recalculate candidate score after profile creation
        await recalculateCandidateScores(result.insertId);

        return res.status(201).json({
            success: true,
            message: 'Freelancer profile created successfully',
            profile: {
                id: result.insertId,
                user_id: req.user.id,
                bio: bio ?? null,
                years_experience: years_experience ?? 0,
                github_url: github_url ?? null
            }
        });

    } catch (error) {
        console.error('Create freelancer profile error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// GET FREELANCER PROFILE
const getProfile = async (req, res) => {
    try {
        const [profiles] = await pool.execute(
            `SELECT
                id,
                user_id,
                bio,
                years_experience,
                github_url,
                created_at,
                updated_at
             FROM freelancer_profiles
             WHERE user_id = ?`,
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        return res.json({
            success: true,
            profile: profiles[0]
        });

    } catch (error) {
        console.error('Get freelancer profile error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// UPDATE FREELANCER PROFILE
const updateProfile = async (req, res) => {
    try {
        const {
            bio,
            years_experience,
            github_url
        } = req.body;

        if (
            years_experience !== undefined &&
            (
                Number.isNaN(Number(years_experience)) ||
                Number(years_experience) < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Years of experience must be a non-negative number'
            });
        }

        const [existingProfile] = await pool.execute(
            `SELECT id
             FROM freelancer_profiles
             WHERE user_id = ?`,
            [req.user.id]
        );

        if (existingProfile.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const freelancerId = existingProfile[0].id;

        await pool.execute(
            `UPDATE freelancer_profiles
             SET bio = ?,
                 years_experience = ?,
                 github_url = ?
             WHERE user_id = ?`,
            [
                bio ?? null,
                years_experience ?? 0,
                github_url ?? null,
                req.user.id
            ]
        );

        // Recalculate candidate score after profile update
        await recalculateCandidateScores(freelancerId);

        const [updatedProfile] = await pool.execute(
            `SELECT
                id,
                user_id,
                bio,
                years_experience,
                github_url,
                created_at,
                updated_at
             FROM freelancer_profiles
             WHERE user_id = ?`,
            [req.user.id]
        );

        return res.json({
            success: true,
            message: 'Freelancer profile updated successfully',
            profile: updatedProfile[0]
        });

    } catch (error) {
        console.error('Update freelancer profile error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


module.exports = {
    createProfile,
    getProfile,
    updateProfile
};