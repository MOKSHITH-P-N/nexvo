const pool = require('../config/db');

const {
    analyzeProject
} = require('../services/openrouterService');

const {
    getActiveSkills
} = require('../services/skillService');


// ============================================================
// CREATE PROJECT
// ============================================================

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

        // ----------------------------------------------------
        // Validation
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // Get canonical skills from database
        // ----------------------------------------------------

        const skills = await getActiveSkills();

        const availableSkillNames = skills.map(
            skill => skill.name
        );

        // ----------------------------------------------------
        // Analyze project using AI
        // ----------------------------------------------------

        const analysis = await analyzeProject(
            title,
            description,
            availableSkillNames
        );

        // ----------------------------------------------------
        // Validate AI response
        // ----------------------------------------------------

        if (
            !analysis ||
            !Array.isArray(analysis.skills) ||
            !Number.isInteger(analysis.complexity) ||
            analysis.complexity < 1 ||
            analysis.complexity > 5 ||
            typeof analysis.complexity_reason !== 'string'
        ) {
            throw new Error('Invalid project analysis returned by AI');
        }

        // ----------------------------------------------------
        // Map AI skill names to database skill IDs
        // ----------------------------------------------------

        const skillMap = new Map(
            skills.map(skill => [
                skill.name,
                skill.id
            ])
        );

        const matchedSkillIds = analysis.skills
            .map(skillName => skillMap.get(skillName))
            .filter(skillId => skillId !== undefined);

        // ----------------------------------------------------
        // Create project
        // ----------------------------------------------------

        const [result] = await pool.execute(
            `INSERT INTO projects (
                client_id,
                title,
                description,
                budget_min,
                budget_max,
                application_open_at,
                application_close_at,
                deadline,
                complexity,
                complexity_reason
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                title,
                description,
                budget_min ?? null,
                budget_max ?? null,
                application_open_at ?? null,
                application_close_at ?? null,
                deadline ?? null,
                analysis.complexity,
                analysis.complexity_reason
            ]
        );

        const projectId = result.insertId;

        // ----------------------------------------------------
        // Insert project ↔ skill relationships
        // ----------------------------------------------------

        if (matchedSkillIds.length > 0) {

            const values = matchedSkillIds.map(
                skillId => [
                    projectId,
                    skillId
                ]
            );

            await pool.query(
                `INSERT INTO project_skills (
                    project_id,
                    skill_id
                )
                VALUES ?`,
                [values]
            );
        }

        // ----------------------------------------------------
        // Return created project
        // ----------------------------------------------------

        return res.status(201).json({
            success: true,
            message: 'Project created successfully',

            project: {
                id: projectId,
                client_id: req.user.id,
                title,
                description,
                budget_min: budget_min ?? null,
                budget_max: budget_max ?? null,
                application_open_at: application_open_at ?? null,
                application_close_at: application_close_at ?? null,
                deadline: deadline ?? null,
                status: 'OPEN',

                complexity: analysis.complexity,
                complexity_reason: analysis.complexity_reason,

                skills: analysis.skills
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


// ============================================================
// GET MY PROJECTS
// ============================================================

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
                complexity,
                complexity_reason,
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


// ============================================================
// GET PROJECT BY ID
// ============================================================

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
                complexity,
                complexity_reason,
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

        // ----------------------------------------------------
        // Client can always view their own project
        // ----------------------------------------------------

        if (
            req.user.role === 'CLIENT' &&
            project.client_id === req.user.id
        ) {
            return res.status(200).json({
                success: true,
                project
            });
        }

        // ----------------------------------------------------
        // Other authenticated users can only view OPEN projects
        // ----------------------------------------------------

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


// ============================================================
// UPDATE PROJECT
// ============================================================

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

        // ----------------------------------------------------
        // Validation
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // Update project
        // ----------------------------------------------------

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


// ============================================================
// CANCEL PROJECT
// ============================================================

const cancelProject = async (req, res) => {
    try {

        const projectId = req.params.id;

        // ----------------------------------------------------
        // Find project
        // ----------------------------------------------------

        const [projects] = await pool.execute(
            `SELECT
                id,
                client_id,
                status
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

        // ----------------------------------------------------
        // Ownership check
        // ----------------------------------------------------

        if (project.client_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // ----------------------------------------------------
        // Status checks
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // Cancel project
        // ----------------------------------------------------

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


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createProject,
    getMyProjects,
    getProjectById,
    updateProject,
    cancelProject
};