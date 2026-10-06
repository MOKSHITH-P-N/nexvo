const pool = require('../../config/db');

const {
    recalculateCandidateScores
} = require('../../services/freelancerScoreService');


// ============================================================
// ADD EXPERIENCE
// ============================================================

const addExperience = async (req, res) => {
    try {

        const {
            company_name,
            job_title,
            start_date,
            end_date,
            is_current,
            description
        } = req.body;


        if (!company_name || !job_title || !start_date) {
            return res.status(400).json({
                success: false,
                message: 'company_name, job_title and start_date are required'
            });
        }


        if (
            is_current !== undefined &&
            typeof is_current !== 'boolean'
        ) {
            return res.status(400).json({
                success: false,
                message: 'is_current must be a boolean'
            });
        }


        if (is_current === true && end_date) {
            return res.status(400).json({
                success: false,
                message: 'Current experience cannot have an end_date'
            });
        }


        if (is_current === false && !end_date) {
            return res.status(400).json({
                success: false,
                message: 'end_date is required when is_current is false'
            });
        }


        if (
            end_date &&
            new Date(end_date) < new Date(start_date)
        ) {
            return res.status(400).json({
                success: false,
                message: 'end_date cannot be earlier than start_date'
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
            `INSERT INTO freelancer_experience (
                freelancer_id,
                company_name,
                job_title,
                start_date,
                end_date,
                is_current,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                freelancerId,
                company_name,
                job_title,
                start_date,
                end_date ?? null,
                is_current ?? false,
                description ?? null
            ]
        );


        // Recalculate candidate score
        await recalculateCandidateScores(freelancerId);


        return res.status(201).json({
            success: true,
            message: 'Experience added successfully',
            experience: {
                id: result.insertId,
                freelancer_id: freelancerId,
                company_name,
                job_title,
                start_date,
                end_date: end_date ?? null,
                is_current: is_current ?? false,
                description: description ?? null
            }
        });

    } catch (error) {

        console.error('Add freelancer experience error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// GET ALL EXPERIENCE
// ============================================================

const getExperience = async (req, res) => {
    try {

        const [experience] = await pool.execute(
            `SELECT
                fe.id,
                fe.company_name,
                fe.job_title,
                fe.start_date,
                fe.end_date,
                fe.is_current,
                fe.description,
                fe.created_at
             FROM freelancer_experience fe
             INNER JOIN freelancer_profiles fp
                 ON fp.id = fe.freelancer_id
             WHERE fp.user_id = ?
             ORDER BY fe.start_date DESC`,
            [req.user.id]
        );


        return res.json({
            success: true,
            experience
        });

    } catch (error) {

        console.error('Get freelancer experience error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// GET EXPERIENCE BY ID
// ============================================================

const getExperienceById = async (req, res) => {
    try {

        const experienceId = Number(req.params.id);


        if (!Number.isInteger(experienceId) || experienceId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid experience ID'
            });
        }


        const [experience] = await pool.execute(
            `SELECT
                fe.id,
                fe.company_name,
                fe.job_title,
                fe.start_date,
                fe.end_date,
                fe.is_current,
                fe.description,
                fe.created_at
             FROM freelancer_experience fe
             INNER JOIN freelancer_profiles fp
                 ON fp.id = fe.freelancer_id
             WHERE fe.id = ?
             AND fp.user_id = ?`,
            [experienceId, req.user.id]
        );


        if (experience.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Experience record not found'
            });
        }


        return res.json({
            success: true,
            experience: experience[0]
        });

    } catch (error) {

        console.error('Get experience by ID error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// UPDATE EXPERIENCE
// ============================================================

const updateExperience = async (req, res) => {
    try {

        const experienceId = Number(req.params.id);


        if (!Number.isInteger(experienceId) || experienceId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid experience ID'
            });
        }


        const {
            company_name,
            job_title,
            start_date,
            end_date,
            is_current,
            description
        } = req.body;


        if (
            is_current !== undefined &&
            typeof is_current !== 'boolean'
        ) {
            return res.status(400).json({
                success: false,
                message: 'is_current must be a boolean'
            });
        }


        const [existing] = await pool.execute(
            `SELECT
                fe.id,
                fe.freelancer_id,
                fe.company_name,
                fe.job_title,
                fe.start_date,
                fe.end_date,
                fe.is_current,
                fe.description
             FROM freelancer_experience fe
             INNER JOIN freelancer_profiles fp
                 ON fp.id = fe.freelancer_id
             WHERE fe.id = ?
             AND fp.user_id = ?`,
            [experienceId, req.user.id]
        );


        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Experience record not found'
            });
        }


        const old = existing[0];

        const freelancerId = old.freelancer_id;


        const newCompanyName =
            company_name !== undefined
                ? company_name
                : old.company_name;


        const newJobTitle =
            job_title !== undefined
                ? job_title
                : old.job_title;


        const newStartDate =
            start_date !== undefined
                ? start_date
                : old.start_date;


        const newIsCurrent =
            is_current !== undefined
                ? is_current
                : Boolean(old.is_current);


        let newEndDate;


        if (newIsCurrent === true) {

            if (end_date !== undefined && end_date !== null) {
                return res.status(400).json({
                    success: false,
                    message: 'Current experience cannot have an end_date'
                });
            }

            newEndDate = null;

        } else {

            newEndDate =
                end_date !== undefined
                    ? end_date
                    : old.end_date;


            if (!newEndDate) {
                return res.status(400).json({
                    success: false,
                    message: 'end_date is required when is_current is false'
                });
            }
        }


        if (
            !newCompanyName ||
            !newJobTitle ||
            !newStartDate
        ) {
            return res.status(400).json({
                success: false,
                message: 'company_name, job_title and start_date are required'
            });
        }


        if (
            newEndDate &&
            new Date(newEndDate) < new Date(newStartDate)
        ) {
            return res.status(400).json({
                success: false,
                message: 'end_date cannot be earlier than start_date'
            });
        }


        await pool.execute(
            `UPDATE freelancer_experience
             SET company_name = ?,
                 job_title = ?,
                 start_date = ?,
                 end_date = ?,
                 is_current = ?,
                 description = ?
             WHERE id = ?`,
            [
                newCompanyName,
                newJobTitle,
                newStartDate,
                newEndDate,
                newIsCurrent,
                description !== undefined
                    ? description
                    : old.description,
                experienceId
            ]
        );


        // Recalculate candidate score
        await recalculateCandidateScores(freelancerId);


        return res.json({
            success: true,
            message: 'Experience updated successfully'
        });

    } catch (error) {

        console.error('Update freelancer experience error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// DELETE EXPERIENCE
// ============================================================

const deleteExperience = async (req, res) => {
    try {

        const experienceId = Number(req.params.id);


        if (!Number.isInteger(experienceId) || experienceId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid experience ID'
            });
        }


        const [existing] = await pool.execute(
            `SELECT fe.freelancer_id
             FROM freelancer_experience fe
             INNER JOIN freelancer_profiles fp
                 ON fp.id = fe.freelancer_id
             WHERE fe.id = ?
             AND fp.user_id = ?`,
            [experienceId, req.user.id]
        );


        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Experience record not found'
            });
        }


        const freelancerId = existing[0].freelancer_id;


        const [result] = await pool.execute(
            `DELETE fe
             FROM freelancer_experience fe
             INNER JOIN freelancer_profiles fp
                 ON fp.id = fe.freelancer_id
             WHERE fe.id = ?
             AND fp.user_id = ?`,
            [experienceId, req.user.id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Experience record not found'
            });
        }


        // Recalculate candidate score
        await recalculateCandidateScores(freelancerId);


        return res.json({
            success: true,
            message: 'Experience deleted successfully'
        });

    } catch (error) {

        console.error('Delete freelancer experience error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    addExperience,
    getExperience,
    getExperienceById,
    updateExperience,
    deleteExperience
};