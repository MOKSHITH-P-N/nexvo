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

    return profiles.length ? profiles[0].id : null;
};


// ADD OPEN SOURCE CONTRIBUTION
const addOpenSource = async (req, res) => {
    try {
        const {
            project_name,
            repository_url,
            contributions_count,
            description
        } = req.body;

        if (!project_name || !project_name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
        }

        if (!repository_url || !repository_url.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Repository URL is required'
            });
        }

        if (
            contributions_count !== undefined &&
            (
                !Number.isInteger(Number(contributions_count)) ||
                Number(contributions_count) < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Contributions count must be a non-negative integer'
            });
        }

        const contributions = Number(contributions_count ?? 0);

        if (contributions > 20) {
            return res.status(400).json({
                success: false,
                message: 'Contributions count cannot exceed 20'
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
            `INSERT INTO freelancer_open_source
             (
                freelancer_id,
                project_name,
                repository_url,
                contributions_count,
                description
             )
             VALUES (?, ?, ?, ?, ?)`,
            [
                freelancerId,
                project_name.trim(),
                repository_url.trim(),
                contributions,
                description ?? null
            ]
        );

        const [projects] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                project_name,
                repository_url,
                contributions_count,
                description,
                created_at
             FROM freelancer_open_source
             WHERE id = ? AND freelancer_id = ?`,
            [result.insertId, freelancerId]
        );

        // Recalculate candidate score after adding open-source contribution
        await recalculateCandidateScores(freelancerId);

        return res.status(201).json({
            success: true,
            message: 'Open-source contribution added successfully',
            open_source: projects[0]
        });

    } catch (error) {
        console.error('Add open-source contribution error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// GET ALL OPEN SOURCE CONTRIBUTIONS
const getOpenSource = async (req, res) => {
    try {
        const freelancerId = await getFreelancerId(req.user.id);

        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const [projects] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                project_name,
                repository_url,
                contributions_count,
                description,
                created_at
             FROM freelancer_open_source
             WHERE freelancer_id = ?
             ORDER BY created_at DESC`,
            [freelancerId]
        );

        return res.json({
            success: true,
            open_source: projects
        });

    } catch (error) {
        console.error('Get open-source contributions error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// GET OPEN SOURCE BY ID
const getOpenSourceById = async (req, res) => {
    try {
        const openSourceId = Number(req.params.id);

        if (!Number.isInteger(openSourceId) || openSourceId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid open-source ID'
            });
        }

        const freelancerId = await getFreelancerId(req.user.id);

        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const [projects] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                project_name,
                repository_url,
                contributions_count,
                description,
                created_at
             FROM freelancer_open_source
             WHERE id = ? AND freelancer_id = ?`,
            [openSourceId, freelancerId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Open-source contribution not found'
            });
        }

        return res.json({
            success: true,
            open_source: projects[0]
        });

    } catch (error) {
        console.error('Get open-source contribution by ID error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// UPDATE OPEN SOURCE
const updateOpenSource = async (req, res) => {
    try {
        const openSourceId = Number(req.params.id);

        if (!Number.isInteger(openSourceId) || openSourceId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid open-source ID'
            });
        }

        const {
            project_name,
            repository_url,
            contributions_count,
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
             FROM freelancer_open_source
             WHERE id = ? AND freelancer_id = ?`,
            [openSourceId, freelancerId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Open-source contribution not found'
            });
        }

        const current = existing[0];

        const newProjectName =
            project_name !== undefined
                ? project_name.trim()
                : current.project_name;

        const newRepositoryUrl =
            repository_url !== undefined
                ? repository_url.trim()
                : current.repository_url;

        const newContributions =
            contributions_count !== undefined
                ? Number(contributions_count)
                : current.contributions_count;

        const newDescription =
            description !== undefined
                ? description
                : current.description;

        if (!newProjectName) {
            return res.status(400).json({
                success: false,
                message: 'Project name cannot be empty'
            });
        }

        if (!newRepositoryUrl) {
            return res.status(400).json({
                success: false,
                message: 'Repository URL cannot be empty'
            });
        }

        if (
            !Number.isInteger(newContributions) ||
            newContributions < 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Contributions count must be a non-negative integer'
            });
        }

        if (newContributions > 20) {
            return res.status(400).json({
                success: false,
                message: 'Contributions count cannot exceed 20'
            });
        }

        await pool.execute(
            `UPDATE freelancer_open_source
             SET
                project_name = ?,
                repository_url = ?,
                contributions_count = ?,
                description = ?
             WHERE id = ? AND freelancer_id = ?`,
            [
                newProjectName,
                newRepositoryUrl,
                newContributions,
                newDescription,
                openSourceId,
                freelancerId
            ]
        );

        const [updatedProject] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                project_name,
                repository_url,
                contributions_count,
                description,
                created_at
             FROM freelancer_open_source
             WHERE id = ? AND freelancer_id = ?`,
            [openSourceId, freelancerId]
        );

        // Recalculate candidate score after updating open-source contribution
        await recalculateCandidateScores(freelancerId);

        return res.json({
            success: true,
            message: 'Open-source contribution updated successfully',
            open_source: updatedProject[0]
        });

    } catch (error) {
        console.error('Update open-source contribution error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// DELETE OPEN SOURCE
const deleteOpenSource = async (req, res) => {
    try {
        const openSourceId = Number(req.params.id);

        if (!Number.isInteger(openSourceId) || openSourceId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid open-source ID'
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
            `DELETE FROM freelancer_open_source
             WHERE id = ? AND freelancer_id = ?`,
            [openSourceId, freelancerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Open-source contribution not found'
            });
        }

        // Recalculate candidate score after deleting open-source contribution
        await recalculateCandidateScores(freelancerId);

        return res.json({
            success: true,
            message: 'Open-source contribution deleted successfully'
        });

    } catch (error) {
        console.error('Delete open-source contribution error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


module.exports = {
    addOpenSource,
    getOpenSource,
    getOpenSourceById,
    updateOpenSource,
    deleteOpenSource
};