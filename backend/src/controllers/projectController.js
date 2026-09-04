const pool = require('../config/db');

const createProject = async (req, res) => {
    try {
        const {
            title,
            description,
            budget_min,
            budget_max,
            application_open_at,
            application_close_at,
            deadline
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required'
            });
        }

        if (
            budget_min !== undefined &&
            budget_max !== undefined &&
            budget_min !== null &&
            budget_max !== null &&
            Number(budget_min) > Number(budget_max)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Minimum budget cannot be greater than maximum budget'
            });
        }

        if (
            application_open_at &&
            application_close_at &&
            new Date(application_open_at) >= new Date(application_close_at)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Application close time must be after open time'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO projects (
                client_id,
                title,
                description,
                budget_min,
                budget_max,
                application_open_at,
                application_close_at,
                deadline
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                title,
                description,
                budget_min || null,
                budget_max || null,
                application_open_at || null,
                application_close_at || null,
                deadline || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Project created successfully',
            project: {
                id: result.insertId,
                client_id: req.user.id,
                title,
                description,
                budget_min: budget_min || null,
                budget_max: budget_max || null,
                application_open_at: application_open_at || null,
                application_close_at: application_close_at || null,
                deadline: deadline || null,
                status: 'OPEN'
            }
        });
    } catch (error) {
        console.error('Create project error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
const getMyProjects = async (req, res) => {
    try {
        const [projects] = await pool.execute(
            `SELECT
                id,
                client_id,
                title,
                description,
                budget_min,
                budget_max,
                application_open_at,
                application_close_at,
                deadline,
                status,
                created_at,
                updated_at
             FROM projects
             WHERE client_id = ?
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            projects
        });
    } catch (error) {
        console.error('Get my projects error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
const getProjectById = async (req, res) => {
    try {
        const projectId = req.params.id;

        const [projects] = await pool.execute(
            `SELECT
                id,
                client_id,
                title,
                description,
                budget_min,
                budget_max,
                application_open_at,
                application_close_at,
                deadline,
                status,
                created_at,
                updated_at
             FROM projects
             WHERE id = ?`,
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const project = projects[0];

        // Client can always view their own project
        if (
            req.user.role === 'CLIENT' &&
            project.client_id === req.user.id
        ) {
            return res.status(200).json({
                success: true,
                project
            });
        }

        // Other authenticated users can only view OPEN projects
        if (project.status !== 'OPEN') {
            return res.status(403).json({
                success: false,
                message: 'Project is not available'
            });
        }

        return res.status(200).json({
            success: true,
            project
        });

    } catch (error) {
        console.error('Get project by ID error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
const updateProject = async (req, res) => {
    try {
        const projectId = req.params.id;

        const {
            title,
            description,
            budget_min,
            budget_max,
            application_open_at,
            application_close_at,
            deadline
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required'
            });
        }

        if (
            budget_min !== undefined &&
            budget_max !== undefined &&
            budget_min !== null &&
            budget_max !== null &&
            Number(budget_min) > Number(budget_max)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Minimum budget cannot be greater than maximum budget'
            });
        }

        if (
            application_open_at &&
            application_close_at &&
            new Date(application_open_at) >= new Date(application_close_at)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Application close time must be after open time'
            });
        }

        const [result] = await pool.execute(
            `UPDATE projects
             SET
                title = ?,
                description = ?,
                budget_min = ?,
                budget_max = ?,
                application_open_at = ?,
                application_close_at = ?,
                deadline = ?
             WHERE id = ?
             AND client_id = ?`,
            [
                title,
                description,
                budget_min ?? null,
                budget_max ?? null,
                application_open_at ?? null,
                application_close_at ?? null,
                deadline ?? null,
                projectId,
                req.user.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or access denied'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Project updated successfully'
        });

    } catch (error) {
        console.error('Update project error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
const cancelProject = async (req, res) => {
    try {
        const projectId = req.params.id;

        const [projects] = await pool.execute(
            `SELECT id, client_id, status
             FROM projects
             WHERE id = ?`,
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const project = projects[0];

        if (project.client_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (project.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                message: 'Project is already cancelled'
            });
        }

        if (project.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Closed project cannot be cancelled'
            });
        }

        await pool.execute(
            `UPDATE projects
             SET status = 'CANCELLED'
             WHERE id = ?`,
            [projectId]
        );

        return res.status(200).json({
            success: true,
            message: 'Project cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel project error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
module.exports = {
    createProject,
    getMyProjects,
    getProjectById,
    updateProject,
    cancelProject
};