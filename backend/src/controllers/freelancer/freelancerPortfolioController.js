const pool = require('../../config/db');

const {
    analyzePortfolioProject
} = require('../../services/openrouterService');

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


// CREATE PORTFOLIO PROJECT
const addPortfolioProject = async (req, res) => {
    try {
        const {
            title,
            description,
            technologies,
            github_url,
            live_url,
            has_deployment,
            github_stars
        } = req.body;

        if (!title || !description || !technologies) {
            return res.status(400).json({
                success: false,
                message: 'title, description and technologies are required'
            });
        }

        if (
            has_deployment !== undefined &&
            typeof has_deployment !== 'boolean'
        ) {
            return res.status(400).json({
                success: false,
                message: 'has_deployment must be a boolean'
            });
        }

        if (
            github_stars !== undefined &&
            (
                !Number.isInteger(Number(github_stars)) ||
                Number(github_stars) < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'github_stars must be a non-negative integer'
            });
        }

        const freelancerId = await getFreelancerId(req.user.id);

        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        // Analyze project complexity using existing AI service
        const analysis = await analyzePortfolioProject(
            title,
            description,
            technologies
        );

        const [result] = await pool.execute(
            `INSERT INTO portfolio_projects (
                freelancer_id,
                title,
                description,
                technologies,
                github_url,
                live_url,
                has_deployment,
                github_stars,
                complexity,
                complexity_reason
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                freelancerId,
                title,
                description,
                technologies,
                github_url ?? null,
                live_url ?? null,
                has_deployment ?? false,
                github_stars ?? 0,
                analysis.complexity,
                analysis.complexity_reason
            ]
        );

        // Recalculate candidate score after adding project
        await recalculateCandidateScores(freelancerId);

        return res.status(201).json({
            success: true,
            message: 'Portfolio project added successfully',
            project: {
                id: result.insertId,
                freelancer_id: freelancerId,
                title,
                description,
                technologies,
                github_url: github_url ?? null,
                live_url: live_url ?? null,
                has_deployment: has_deployment ?? false,
                github_stars: github_stars ?? 0,
                complexity: analysis.complexity,
                complexity_reason: analysis.complexity_reason
            }
        });

    } catch (error) {
        console.error('Add portfolio project error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// GET ALL PORTFOLIO PROJECTS
const getPortfolioProjects = async (req, res) => {
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
                title,
                description,
                technologies,
                github_url,
                live_url,
                has_deployment,
                github_stars,
                complexity,
                complexity_reason,
                created_at,
                updated_at
             FROM portfolio_projects
             WHERE freelancer_id = ?
             ORDER BY created_at DESC`,
            [freelancerId]
        );

        return res.json({
            success: true,
            projects
        });

    } catch (error) {
        console.error('Get portfolio projects error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// GET ONE PORTFOLIO PROJECT
const getPortfolioProject = async (req, res) => {
    try {
        const projectId = Number(req.params.id);

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid portfolio project ID'
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
                title,
                description,
                technologies,
                github_url,
                live_url,
                has_deployment,
                github_stars,
                complexity,
                complexity_reason,
                created_at,
                updated_at
             FROM portfolio_projects
             WHERE id = ?
             AND freelancer_id = ?`,
            [projectId, freelancerId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Portfolio project not found'
            });
        }

        return res.json({
            success: true,
            project: projects[0]
        });

    } catch (error) {
        console.error('Get portfolio project error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// UPDATE PORTFOLIO PROJECT
const updatePortfolioProject = async (req, res) => {
    try {
        const projectId = Number(req.params.id);

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid portfolio project ID'
            });
        }

        const {
            title,
            description,
            technologies,
            github_url,
            live_url,
            has_deployment,
            github_stars
        } = req.body;

        if (
            has_deployment !== undefined &&
            typeof has_deployment !== 'boolean'
        ) {
            return res.status(400).json({
                success: false,
                message: 'has_deployment must be a boolean'
            });
        }

        if (
            github_stars !== undefined &&
            (
                !Number.isInteger(Number(github_stars)) ||
                Number(github_stars) < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'github_stars must be a non-negative integer'
            });
        }

        const freelancerId = await getFreelancerId(req.user.id);

        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const [existing] = await pool.execute(
            `SELECT
                id,
                title,
                description,
                technologies,
                github_url,
                live_url,
                has_deployment,
                github_stars,
                complexity,
                complexity_reason
             FROM portfolio_projects
             WHERE id = ?
             AND freelancer_id = ?`,
            [projectId, freelancerId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Portfolio project not found'
            });
        }

        const old = existing[0];

        const newTitle =
            title !== undefined
                ? title
                : old.title;

        const newDescription =
            description !== undefined
                ? description
                : old.description;

        const newTechnologies =
            technologies !== undefined
                ? technologies
                : old.technologies;

        // Re-run AI complexity analysis only when
        // title, description, or technologies change
        const coreDetailsChanged =
            title !== undefined ||
            description !== undefined ||
            technologies !== undefined;

        let complexity = old.complexity;
        let complexityReason = old.complexity_reason;

        if (coreDetailsChanged) {
            const analysis = await analyzePortfolioProject(
                newTitle,
                newDescription,
                newTechnologies
            );

            complexity = analysis.complexity;
            complexityReason = analysis.complexity_reason;
        }

        await pool.execute(
            `UPDATE portfolio_projects
             SET title = ?,
                 description = ?,
                 technologies = ?,
                 github_url = ?,
                 live_url = ?,
                 has_deployment = ?,
                 github_stars = ?,
                 complexity = ?,
                 complexity_reason = ?
             WHERE id = ?
             AND freelancer_id = ?`,
            [
                newTitle,
                newDescription,
                newTechnologies,
                github_url !== undefined
                    ? github_url
                    : old.github_url,
                live_url !== undefined
                    ? live_url
                    : old.live_url,
                has_deployment !== undefined
                    ? has_deployment
                    : old.has_deployment,
                github_stars !== undefined
                    ? Number(github_stars)
                    : old.github_stars,
                complexity,
                complexityReason,
                projectId,
                freelancerId
            ]
        );

        // Recalculate candidate score after project update
        await recalculateCandidateScores(freelancerId);

        return res.json({
            success: true,
            message: 'Portfolio project updated successfully'
        });

    } catch (error) {
        console.error('Update portfolio project error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// DELETE PORTFOLIO PROJECT
const deletePortfolioProject = async (req, res) => {
    try {
        const projectId = Number(req.params.id);

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid portfolio project ID'
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
            `DELETE FROM portfolio_projects
             WHERE id = ?
             AND freelancer_id = ?`,
            [projectId, freelancerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Portfolio project not found'
            });
        }

        // Recalculate candidate score after project deletion
        await recalculateCandidateScores(freelancerId);

        return res.json({
            success: true,
            message: 'Portfolio project deleted successfully'
        });

    } catch (error) {
        console.error('Delete portfolio project error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


module.exports = {
    addPortfolioProject,
    getPortfolioProjects,
    getPortfolioProject,
    updatePortfolioProject,
    deletePortfolioProject
};