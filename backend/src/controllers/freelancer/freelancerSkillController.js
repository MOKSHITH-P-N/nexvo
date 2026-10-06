const pool = require('../../config/db');

const {
    recalculateCandidateScores
} = require('../../services/freelancerScoreService');


// ADD SKILLS
const addSkills = async (req, res) => {
    try {
        const { skill_ids } = req.body;

        if (!Array.isArray(skill_ids) || skill_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'skill_ids must be a non-empty array'
            });
        }

        const invalidIds = skill_ids.some(
            (id) => !Number.isInteger(Number(id)) || Number(id) <= 0
        );

        if (invalidIds) {
            return res.status(400).json({
                success: false,
                message: 'skill_ids must contain valid positive integers'
            });
        }

        const uniqueSkillIds = [
            ...new Set(skill_ids.map((id) => Number(id)))
        ];

        const [profiles] = await pool.execute(
            `SELECT id
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

        const freelancerId = profiles[0].id;

        const placeholders = uniqueSkillIds.map(() => '?').join(', ');

        const [skills] = await pool.execute(
            `SELECT id, name
             FROM skills
             WHERE id IN (${placeholders})
             AND is_active = TRUE`,
            uniqueSkillIds
        );

        if (skills.length !== uniqueSkillIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more skill IDs are invalid or inactive'
            });
        }

        for (const skillId of uniqueSkillIds) {
            await pool.execute(
                `INSERT IGNORE INTO freelancer_skills (
                    freelancer_id,
                    skill_id
                )
                VALUES (?, ?)`,
                [freelancerId, skillId]
            );
        }

        // Recalculate candidate score after adding skills
        await recalculateCandidateScores(freelancerId);

        return res.status(201).json({
            success: true,
            message: 'Freelancer skills added successfully',
            skills
        });

    } catch (error) {
        console.error('Add freelancer skills error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// GET FREELANCER SKILLS
const getSkills = async (req, res) => {
    try {
        const [skills] = await pool.execute(
            `SELECT
                s.id,
                s.name
             FROM freelancer_skills fs
             INNER JOIN freelancer_profiles fp
                ON fp.id = fs.freelancer_id
             INNER JOIN skills s
                ON s.id = fs.skill_id
             WHERE fp.user_id = ?
             ORDER BY s.name`,
            [req.user.id]
        );

        return res.json({
            success: true,
            skills
        });

    } catch (error) {
        console.error('Get freelancer skills error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// DELETE SKILL
const deleteSkill = async (req, res) => {
    try {
        const skillId = Number(req.params.skillId);

        if (!Number.isInteger(skillId) || skillId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid skill ID'
            });
        }

        const [profiles] = await pool.execute(
            `SELECT id
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

        const freelancerId = profiles[0].id;

        const [result] = await pool.execute(
            `DELETE FROM freelancer_skills
             WHERE freelancer_id = ?
             AND skill_id = ?`,
            [freelancerId, skillId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found in freelancer profile'
            });
        }

        // Recalculate candidate score after removing skill
        await recalculateCandidateScores(freelancerId);

        return res.json({
            success: true,
            message: 'Skill removed successfully'
        });

    } catch (error) {
        console.error('Delete freelancer skill error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


module.exports = {
    addSkills,
    getSkills,
    deleteSkill
};