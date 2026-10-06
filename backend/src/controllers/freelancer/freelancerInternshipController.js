const pool = require('../../config/db');

const {
    recalculateCandidateScores
} = require('../../services/freelancerScoreService');


// GET FREELANCER ID
const getFreelancerId = async (userId) => {
    const [profiles] = await pool.execute(
        `SELECT id
         FROM freelancer_profiles
         WHERE user_id = ?`,
        [userId]
    );

    if (profiles.length === 0) {
        return null;
    }

    return profiles[0].id;
};


// ADD INTERNSHIP
const addInternship = async (req, res) => {
    try {
        const {
            company_name,
            role,
            start_date,
            end_date,
            description
        } = req.body;

        if (!company_name || !company_name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required'
            });
        }

        if (!role || !role.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Role is required'
            });
        }

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid start date or end date'
            });
        }

        if (end < start) {
            return res.status(400).json({
                success: false,
                message: 'End date cannot be before start date'
            });
        }

        const freelancerId = await getFreelancerId(req.user.id);

        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO freelancer_internships
             (
                freelancer_id,
                company_name,
                role,
                start_date,
                end_date,
                description
             )
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                freelancerId,
                company_name.trim(),
                role.trim(),
                start_date,
                end_date,
                description ?? null
            ]
        );

        const [internships] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                company_name,
                role,
                start_date,
                end_date,
                description,
                created_at
             FROM freelancer_internships
             WHERE id = ? AND freelancer_id = ?`,
            [result.insertId, freelancerId]
        );

        // Recalculate candidate score after internship is added
        await recalculateCandidateScores(freelancerId);

        return res.status(201).json({
            success: true,
            message: 'Internship added successfully',
            internship: internships[0]
        });

    } catch (error) {
        console.error('Add internship error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// GET ALL INTERNSHIPS
const getInternships = async (req, res) => {
    try {
        const freelancerId = await getFreelancerId(req.user.id);

        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const [internships] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                company_name,
                role,
                start_date,
                end_date,
                description,
                created_at
             FROM freelancer_internships
             WHERE freelancer_id = ?
             ORDER BY start_date DESC`,
            [freelancerId]
        );

        return res.json({
            success: true,
            internships
        });

    } catch (error) {
        console.error('Get internships error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// GET INTERNSHIP BY ID
const getInternshipById = async (req, res) => {
    try {
        const internshipId = Number(req.params.id);

        if (!Number.isInteger(internshipId) || internshipId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid internship ID'
            });
        }

        const freelancerId = await getFreelancerId(req.user.id);

        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const [internships] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                company_name,
                role,
                start_date,
                end_date,
                description,
                created_at
             FROM freelancer_internships
             WHERE id = ? AND freelancer_id = ?`,
            [internshipId, freelancerId]
        );

        if (internships.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        return res.json({
            success: true,
            internship: internships[0]
        });

    } catch (error) {
        console.error('Get internship by ID error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// UPDATE INTERNSHIP
const updateInternship = async (req, res) => {
    try {
        const internshipId = Number(req.params.id);

        if (!Number.isInteger(internshipId) || internshipId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid internship ID'
            });
        }

        const {
            company_name,
            role,
            start_date,
            end_date,
            description
        } = req.body;

        const freelancerId = await getFreelancerId(req.user.id);

        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const [existing] = await pool.execute(
            `SELECT *
             FROM freelancer_internships
             WHERE id = ? AND freelancer_id = ?`,
            [internshipId, freelancerId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        const current = existing[0];

        const newCompanyName =
            company_name !== undefined
                ? company_name.trim()
                : current.company_name;

        const newRole =
            role !== undefined
                ? role.trim()
                : current.role;

        const newStartDate =
            start_date !== undefined
                ? start_date
                : current.start_date;

        const newEndDate =
            end_date !== undefined
                ? end_date
                : current.end_date;

        if (!newCompanyName) {
            return res.status(400).json({
                success: false,
                message: 'Company name cannot be empty'
            });
        }

        if (!newRole) {
            return res.status(400).json({
                success: false,
                message: 'Role cannot be empty'
            });
        }

        const start = new Date(newStartDate);
        const end = new Date(newEndDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid start date or end date'
            });
        }

        if (end < start) {
            return res.status(400).json({
                success: false,
                message: 'End date cannot be before start date'
            });
        }

        await pool.execute(
            `UPDATE freelancer_internships
             SET
                company_name = ?,
                role = ?,
                start_date = ?,
                end_date = ?,
                description = ?
             WHERE id = ? AND freelancer_id = ?`,
            [
                newCompanyName,
                newRole,
                newStartDate,
                newEndDate,
                description !== undefined
                    ? description
                    : current.description,
                internshipId,
                freelancerId
            ]
        );

        const [updatedInternship] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                company_name,
                role,
                start_date,
                end_date,
                description,
                created_at
             FROM freelancer_internships
             WHERE id = ? AND freelancer_id = ?`,
            [internshipId, freelancerId]
        );

        // Recalculate candidate score after internship is updated
        await recalculateCandidateScores(freelancerId);

        return res.json({
            success: true,
            message: 'Internship updated successfully',
            internship: updatedInternship[0]
        });

    } catch (error) {
        console.error('Update internship error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// DELETE INTERNSHIP
const deleteInternship = async (req, res) => {
    try {
        const internshipId = Number(req.params.id);

        if (!Number.isInteger(internshipId) || internshipId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid internship ID'
            });
        }

        const freelancerId = await getFreelancerId(req.user.id);

        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const [result] = await pool.execute(
            `DELETE FROM freelancer_internships
             WHERE id = ? AND freelancer_id = ?`,
            [internshipId, freelancerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        // Recalculate candidate score after internship is deleted
        await recalculateCandidateScores(freelancerId);

        return res.json({
            success: true,
            message: 'Internship deleted successfully'
        });

    } catch (error) {
        console.error('Delete internship error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


module.exports = {
    addInternship,
    getInternships,
    getInternshipById,
    updateInternship,
    deleteInternship
};