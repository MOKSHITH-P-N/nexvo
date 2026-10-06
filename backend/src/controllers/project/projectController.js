const pool = require('../../config/db');

const {
    analyzeProject
} = require('../../services/openrouterService');

const {
    getActiveSkills
} = require('../../services/skillService');


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


        const matchedSkills = analysis.skills
            .map(skill => ({
                skillId: skillMap.get(skill.name),
                weight: skill.weight
         }))
        .filter(skill => skill.skillId !== undefined);

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
        if (matchedSkills.length > 0) {

    const values = matchedSkills.map(
        skill => [
            projectId,
            skill.skillId,
            skill.weight
        ]
    );

    await pool.query(
        `INSERT INTO project_skills (
            project_id,
            skill_id,
            weight
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
// GET ALL PROJECTS
// Freelancer can see all projects
// ============================================================

// ============================================================
// GET ALL PROJECTS
// Freelancer can see only currently available OPEN projects
// ============================================================

const getAllProjects = async (req, res) => {
    try {

        // ----------------------------------------------------
        // Get freelancer profile ID
        // ----------------------------------------------------

        const [freelancerRows] = await pool.execute(
            `
            SELECT id
            FROM freelancer_profiles
            WHERE user_id = ?
            `,
            [req.user.id]
        );

        if (freelancerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const freelancerId = freelancerRows[0].id;

        // ----------------------------------------------------
        // Get ONLY currently available OPEN projects
        // ----------------------------------------------------

        const [projects] = await pool.execute(
            `
            SELECT
                p.id,
                p.client_id,
                p.title,
                p.description,
                p.budget_min,
                p.budget_max,
                p.application_open_at,
                p.application_close_at,
                p.deadline,
                p.status,
                p.complexity,
                p.complexity_reason,
                p.created_at,
                p.updated_at,

                pa.id AS application_id,
                pa.status AS application_status,
                pa.applied_at,

                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', s.id,
                            'name', s.name,
                            'weight', ps.weight
                        )
                    )
                    FROM project_skills ps
                    INNER JOIN skills s
                        ON s.id = ps.skill_id
                    WHERE ps.project_id = p.id
                      AND s.is_active = TRUE
                ) AS skills

            FROM projects p

            LEFT JOIN project_applications pa
                ON pa.project_id = p.id
                AND pa.freelancer_id = ?

            WHERE p.status = 'OPEN'

              AND (
                    p.application_open_at IS NULL
                    OR p.application_open_at <= NOW()
              )

              AND (
                    p.application_close_at IS NULL
                    OR p.application_close_at > NOW()
              )

              AND (
                    p.deadline IS NULL
                    OR p.deadline > NOW()
              )

            ORDER BY p.created_at DESC
            `,
            [freelancerId]
        );

        // ----------------------------------------------------
        // Convert skills JSON into normal arrays
        // ----------------------------------------------------

        const formattedProjects = projects.map(project => {

            let projectSkills = [];

            if (project.skills) {
                try {
                    projectSkills = Array.isArray(project.skills)
                        ? project.skills
                        : JSON.parse(project.skills);
                } catch (error) {
                    projectSkills = [];
                }
            }

            return {
                ...project,
                skills: projectSkills
            };
        });

        // ----------------------------------------------------
        // Return projects
        // ----------------------------------------------------

        return res.status(200).json({
            success: true,
            count: formattedProjects.length,
            projects: formattedProjects
        });

    } catch (error) {

        console.error('Get all projects error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
// ============================================================
// SEARCH PROJECTS
// Only projects currently accepting applications
// Supports:
// search
// skills
// minBudget
// maxBudget
// startDate
// endDate
// ============================================================

const searchProjects = async (req, res) => {
    try {
        const [freelancerRows] = await pool.execute(
    `
    SELECT id
    FROM freelancer_profiles
    WHERE user_id = ?
    `,
    [req.user.id]
);

if (freelancerRows.length === 0) {
    return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
    });
}

const freelancerId = freelancerRows[0].id;

        const {
            search,
            skills,
            minBudget,
            maxBudget,
            startDate,
            endDate
        } = req.query;

        let query = `
            SELECT
                p.id,
                p.client_id,
                p.title,
                p.description,
                p.budget_min,
                p.budget_max,
                p.application_open_at,
                p.application_close_at,
                p.deadline,
                p.status,
                p.complexity,
                p.complexity_reason,
                p.created_at,
                p.updated_at,

                pa.id AS application_id,
                pa.status AS application_status,
                pa.applied_at,

                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', s.id,
                            'name', s.name,
                            'weight', ps.weight
                        )
                    )
                    FROM project_skills ps
                    INNER JOIN skills s
                        ON s.id = ps.skill_id
                    WHERE ps.project_id = p.id
                      AND s.is_active = TRUE
                ) AS skills

            FROM projects p

            LEFT JOIN project_applications pa
                ON pa.project_id = p.id
                AND pa.freelancer_id = ?

            WHERE p.status = 'OPEN'

              AND (
                    p.application_open_at IS NULL
                    OR p.application_open_at <= NOW()
              )

              AND (
                    p.application_close_at IS NULL
                    OR p.application_close_at > NOW()
              )

              AND (
                    p.deadline IS NULL
                    OR p.deadline > NOW()
              )
        `;

        const params = [freelancerId];

        // ----------------------------------------------------
        // Keyword search
        // ----------------------------------------------------

        if (search && search.trim() !== '') {
            query += `
                AND (
                    p.title LIKE ?
                    OR p.description LIKE ?
                )
            `;

            const searchTerm = `%${search.trim()}%`;

            params.push(searchTerm, searchTerm);
        }

        // ----------------------------------------------------
        // Minimum budget
        // Example:
        // minBudget=10000
        // means project should support at least 10000
        // ----------------------------------------------------

        if (minBudget !== undefined && minBudget !== '') {
            const min = Number(minBudget);

            if (!Number.isFinite(min) || min < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid minimum budget'
                });
            }

            query += `
                AND (
                    p.budget_max IS NULL
                    OR p.budget_max >= ?
                )
            `;

            params.push(min);
        }

        // ----------------------------------------------------
        // Maximum budget
        // ----------------------------------------------------

        if (maxBudget !== undefined && maxBudget !== '') {
            const max = Number(maxBudget);

            if (!Number.isFinite(max) || max < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid maximum budget'
                });
            }

            query += `
                AND (
                    p.budget_min IS NULL
                    OR p.budget_min <= ?
                )
            `;

            params.push(max);
        }

        // ----------------------------------------------------
        // Start date
        // Filters project application start date
        // ----------------------------------------------------

        if (startDate && startDate.trim() !== '') {
            query += `
                AND (
                    p.application_open_at IS NULL
                    OR DATE(p.application_open_at) >= ?
                )
            `;

            params.push(startDate);
        }

        // ----------------------------------------------------
        // End date
        // Filters project deadline
        // ----------------------------------------------------

        if (endDate && endDate.trim() !== '') {
            query += `
                AND (
                    p.deadline IS NULL
                    OR DATE(p.deadline) <= ?
                )
            `;

            params.push(endDate);
        }

        // ----------------------------------------------------
        // Skills
        //
        // Example:
        // ?skills=React,Node.js,MongoDB
        //
        // A project matches if it contains ANY selected skill.
        // ----------------------------------------------------

        if (skills && skills.trim() !== '') {
            const skillNames = skills
                .split(',')
                .map(skill => skill.trim())
                .filter(Boolean);

            if (skillNames.length > 0) {
                const placeholders = skillNames
                    .map(() => '?')
                    .join(',');

                query += `
                    AND EXISTS (
                        SELECT 1
                        FROM project_skills ps_filter
                        INNER JOIN skills s_filter
                            ON s_filter.id = ps_filter.skill_id
                        WHERE ps_filter.project_id = p.id
                          AND s_filter.is_active = TRUE
                          AND s_filter.name IN (${placeholders})
                    )
                `;

                params.push(...skillNames);
            }
        }

        // ----------------------------------------------------
        // Sorting
        // ----------------------------------------------------

        query += `
            ORDER BY p.created_at DESC
        `;

        const [projects] = await pool.execute(query, params);

        // ----------------------------------------------------
        // Convert skills JSON into normal JavaScript arrays
        // ----------------------------------------------------

        const formattedProjects = projects.map(project => {
            let projectSkills = [];

            if (project.skills) {
                try {
                    projectSkills = Array.isArray(project.skills)
                        ? project.skills
                        : JSON.parse(project.skills);
                } catch (error) {
                    projectSkills = [];
                }
            }

            return {
                ...project,
                skills: projectSkills
            };
        });

        return res.status(200).json({
            success: true,
            count: formattedProjects.length,
            projects: formattedProjects
        });

    } catch (error) {
        console.error('Search projects error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// GET OPEN PROJECTS
// Only projects currently accepting applications
// ============================================================

const getOpenProjects = async (req, res) => {
    try {
        const [freelancerRows] = await pool.execute(
    `
    SELECT id
    FROM freelancer_profiles
    WHERE user_id = ?
    `,
    [req.user.id]
);

if (freelancerRows.length === 0) {
    return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
    });
}

const freelancerId = freelancerRows[0].id;

        const [projects] = await pool.execute(
            `
            SELECT
                p.id,
                p.client_id,
                p.title,
                p.description,
                p.budget_min,
                p.budget_max,
                p.application_open_at,
                p.application_close_at,
                p.deadline,
                p.status,
                p.complexity,
                p.complexity_reason,
                p.created_at,
                p.updated_at,

                pa.id AS application_id,
                pa.status AS application_status,
                pa.applied_at,

                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', s.id,
                            'name', s.name,
                            'weight', ps.weight
                        )
                    )
                    FROM project_skills ps
                    INNER JOIN skills s
                        ON s.id = ps.skill_id
                    WHERE ps.project_id = p.id
                      AND s.is_active = TRUE
                ) AS skills

            FROM projects p

            LEFT JOIN project_applications pa
                ON pa.project_id = p.id
                AND pa.freelancer_id = ?

            WHERE p.status = 'OPEN'

              AND (
                    p.application_open_at IS NULL
                    OR p.application_open_at <= NOW()
              )

              AND (
                    p.application_close_at IS NULL
                    OR p.application_close_at > NOW()
              )

              AND (
                    p.deadline IS NULL
                    OR p.deadline > NOW()
              )

            ORDER BY p.created_at DESC
            `,
            [freelancerId]
        );

        const formattedProjects = projects.map(project => {
            let projectSkills = [];

            if (project.skills) {
                try {
                    projectSkills = Array.isArray(project.skills)
                        ? project.skills
                        : JSON.parse(project.skills);
                } catch (error) {
                    projectSkills = [];
                }
            }

            return {
                ...project,
                skills: projectSkills
            };
        });

        return res.status(200).json({
            success: true,
            projects: formattedProjects
        });

    } catch (error) {
        console.error('Get open projects error:', error);

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

        // ----------------------------------------------------
        // Get project
        // ----------------------------------------------------

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
            // Continue below and load skills
        } else {
            // ----------------------------------------------------
            // Other authenticated users can only view OPEN projects
            // ----------------------------------------------------

            if (project.status !== 'OPEN') {
                return res.status(403).json({
                    success: false,
                    message: 'Project is not available'
                });
            }
        }

        // ----------------------------------------------------
        // Get required skills for this project
        // ----------------------------------------------------

        const [skills] = await pool.execute(
            `SELECT
                s.id,
                s.name,
                ps.weight
             FROM project_skills ps
             INNER JOIN skills s
                ON s.id = ps.skill_id
             WHERE ps.project_id = ?
               AND s.is_active = TRUE
             ORDER BY s.name ASC`,
            [projectId]
        );

        // ----------------------------------------------------
        // Return project with required skills
        // ----------------------------------------------------

        return res.status(200).json({
            success: true,
            project: {
                ...project,
                skills
            }
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
    const connection = await pool.getConnection();

    try {
        const projectId = req.params.id;

        // ----------------------------------------------------
        // Start transaction
        // ----------------------------------------------------

        await connection.beginTransaction();

        // ----------------------------------------------------
        // Find project
        // Lock row so two cancellation requests
        // cannot modify it at the same time
        // ----------------------------------------------------

        const [projects] = await connection.execute(
            `
            SELECT
                id,
                client_id,
                status
            FROM projects
            WHERE id = ?
            FOR UPDATE
            `,
            [projectId]
        );

        if (projects.length === 0) {
            await connection.rollback();

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
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // ----------------------------------------------------
        // Already cancelled
        // ----------------------------------------------------

        if (project.status === 'CANCELLED') {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Project is already cancelled'
            });
        }

        // ----------------------------------------------------
        // Completed projects cannot be cancelled
        // ----------------------------------------------------

        if (project.status === 'COMPLETED') {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Completed project cannot be cancelled'
            });
        }

        // ----------------------------------------------------
        // Preserve existing CLOSED restriction
        // ----------------------------------------------------

        if (project.status === 'CLOSED') {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Closed project cannot be cancelled'
            });
        }

        // ----------------------------------------------------
        // Cancel project
        // ----------------------------------------------------

        await connection.execute(
            `
            UPDATE projects
            SET status = 'CANCELLED'
            WHERE id = ?
            `,
            [projectId]
        );

        // ----------------------------------------------------
        // Cancel active applications
        //
        // APPLIED and SHORTLISTED are still active.
        //
        // We intentionally DO NOT change:
        // HIRED
        // REJECTED
        // NOT_ACCEPTED
        //
        // This preserves application history.
        // ----------------------------------------------------

        const [applicationResult] = await connection.execute(
            `
            UPDATE project_applications
            SET status = 'CANCELLED'
            WHERE project_id = ?
              AND status IN ('APPLIED', 'SHORTLISTED')
            `,
            [projectId]
        );

        // ----------------------------------------------------
        // Commit both changes
        // ----------------------------------------------------

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'Project cancelled successfully',
            project_id: projectId,
            applications_cancelled: applicationResult.affectedRows
        });

    } catch (error) {

        await connection.rollback();

        console.error('Cancel project error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

    } finally {
        connection.release();
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createProject,
    getMyProjects,
    getAllProjects,
    getOpenProjects,
    searchProjects,
    getProjectById,
    updateProject,
    cancelProject
};