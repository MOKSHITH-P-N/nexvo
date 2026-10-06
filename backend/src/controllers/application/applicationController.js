const pool = require('../../config/db');

const {
    calculateAndStoreProjectCandidateScore
} = require('../../services/projectRankingService');


// ============================================================
// HELPER: GET FULL FREELANCER PROFILES
// ============================================================

const getFullFreelancerProfiles = async (freelancerIds) => {
    if (!freelancerIds.length) {
        return new Map();
    }

    const placeholders = freelancerIds.map(() => '?').join(',');

    // --------------------------------------------------------
    // Basic profile
    // --------------------------------------------------------

    const [profiles] = await pool.query(
        `
        SELECT
            fp.id AS freelancer_id,
            fp.user_id,
            u.name,
            u.email,
            fp.bio,
            fp.years_experience,
            fp.github_url,
            fp.created_at,
            fp.updated_at
        FROM freelancer_profiles fp
        INNER JOIN users u
            ON u.id = fp.user_id
        WHERE fp.id IN (${placeholders})
        `,
        freelancerIds
    );

    // --------------------------------------------------------
    // Skills
    // --------------------------------------------------------

    const [skills] = await pool.query(
        `
        SELECT
            fs.freelancer_id,
            s.id AS skill_id,
            s.name AS skill_name
        FROM freelancer_skills fs
        INNER JOIN skills s
            ON s.id = fs.skill_id
        WHERE fs.freelancer_id IN (${placeholders})
        ORDER BY s.name
        `,
        freelancerIds
    );

    // --------------------------------------------------------
    // Education
    // --------------------------------------------------------

    const [education] = await pool.query(
        `
        SELECT
            fe.id,
            fe.freelancer_id,
            el.id AS education_level_id,
            el.name AS education_level,
            el.education_score,
            fe.institution,
            fe.field_of_study,
            fe.start_year,
            fe.end_year
        FROM freelancer_education fe
        INNER JOIN education_levels el
            ON el.id = fe.education_level_id
        WHERE fe.freelancer_id IN (${placeholders})
        ORDER BY fe.freelancer_id, fe.end_year DESC
        `,
        freelancerIds
    );

    // --------------------------------------------------------
    // Experience
    // --------------------------------------------------------

    const [experience] = await pool.query(
        `
        SELECT
            id,
            freelancer_id,
            company_name,
            job_title,
            start_date,
            end_date,
            is_current,
            description
        FROM freelancer_experience
        WHERE freelancer_id IN (${placeholders})
        ORDER BY freelancer_id, start_date DESC
        `,
        freelancerIds
    );

    // --------------------------------------------------------
    // Portfolio
    // --------------------------------------------------------

    const [portfolio] = await pool.query(
        `
        SELECT
            id,
            freelancer_id,
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
        WHERE freelancer_id IN (${placeholders})
        ORDER BY freelancer_id, created_at DESC
        `,
        freelancerIds
    );

    // --------------------------------------------------------
    // Certificates
    // --------------------------------------------------------

    const [certificates] = await pool.query(
        `
        SELECT
            id,
            freelancer_id,
            certificate_name,
            issuing_organization,
            certificate_url,
            issued_at,
            verification_status,
            verified_at,
            created_at
        FROM freelancer_certificates
        WHERE freelancer_id IN (${placeholders})
        ORDER BY freelancer_id, issued_at DESC
        `,
        freelancerIds
    );

    // --------------------------------------------------------
    // Internships
    // --------------------------------------------------------

    const [internships] = await pool.query(
        `
        SELECT
            id,
            freelancer_id,
            company_name,
            role,
            start_date,
            end_date,
            description,
            created_at
        FROM freelancer_internships
        WHERE freelancer_id IN (${placeholders})
        ORDER BY freelancer_id, start_date DESC
        `,
        freelancerIds
    );

    // --------------------------------------------------------
    // Hackathons
    // --------------------------------------------------------

    const [hackathons] = await pool.query(
        `
        SELECT
            id,
            freelancer_id,
            hackathon_name,
            position,
            won,
            event_date,
            description,
            created_at
        FROM freelancer_hackathons
        WHERE freelancer_id IN (${placeholders})
        ORDER BY freelancer_id, event_date DESC
        `,
        freelancerIds
    );

    // --------------------------------------------------------
    // Open Source
    // --------------------------------------------------------

    const [openSource] = await pool.query(
        `
        SELECT
            id,
            freelancer_id,
            project_name,
            repository_url,
            contributions_count,
            description,
            created_at
        FROM freelancer_open_source
        WHERE freelancer_id IN (${placeholders})
        ORDER BY freelancer_id, created_at DESC
        `,
        freelancerIds
    );

    // --------------------------------------------------------
    // Assessments
    // --------------------------------------------------------

    const [assessments] = await pool.query(
        `
        SELECT
            a.id,
            a.freelancer_id,
            a.skill_id,
            s.name AS skill_name,
            a.assessment_type,
            a.score,
            a.communication_score,
            a.started_at,
            a.completed_at,
            a.expires_at,
            a.retry_available_at,
            a.status,
            a.created_at
        FROM assessments a
        LEFT JOIN skills s
            ON s.id = a.skill_id
        WHERE a.freelancer_id IN (${placeholders})
        ORDER BY a.freelancer_id, a.created_at DESC
        `,
        freelancerIds
    );

    // --------------------------------------------------------
    // Build profile map
    // --------------------------------------------------------

    const profileMap = new Map();

    profiles.forEach((profile) => {
        profileMap.set(profile.freelancer_id, {
            freelancer_id: profile.freelancer_id,
            user_id: profile.user_id,
            name: profile.name,
            email: profile.email,
            bio: profile.bio,
            years_experience: profile.years_experience,
            github_url: profile.github_url,
            created_at: profile.created_at,
            updated_at: profile.updated_at,

            skills: [],
            education: [],
            experience: [],
            portfolio: [],
            certificates: [],
            internships: [],
            hackathons: [],
            open_source: [],
            assessments: []
        });
    });

    // --------------------------------------------------------
    // Attach skills
    // --------------------------------------------------------

    skills.forEach((item) => {
        const profile = profileMap.get(item.freelancer_id);

        if (profile) {
            profile.skills.push({
                id: item.skill_id,
                name: item.skill_name
            });
        }
    });

    // --------------------------------------------------------
    // Attach education
    // --------------------------------------------------------

    education.forEach((item) => {
        const profile = profileMap.get(item.freelancer_id);

        if (profile) {
            profile.education.push({
                id: item.id,
                education_level_id: item.education_level_id,
                education_level: item.education_level,
                education_score: item.education_score,
                institution: item.institution,
                field_of_study: item.field_of_study,
                start_year: item.start_year,
                end_year: item.end_year
            });
        }
    });

    // --------------------------------------------------------
    // Attach experience
    // --------------------------------------------------------

    experience.forEach((item) => {
        const profile = profileMap.get(item.freelancer_id);

        if (profile) {
            profile.experience.push(item);
        }
    });

    // --------------------------------------------------------
    // Attach portfolio
    // --------------------------------------------------------

    portfolio.forEach((item) => {
        const profile = profileMap.get(item.freelancer_id);

        if (profile) {
            profile.portfolio.push(item);
        }
    });

    // --------------------------------------------------------
    // Attach certificates
    // --------------------------------------------------------

    certificates.forEach((item) => {
        const profile = profileMap.get(item.freelancer_id);

        if (profile) {
            profile.certificates.push(item);
        }
    });

    // --------------------------------------------------------
    // Attach internships
    // --------------------------------------------------------

    internships.forEach((item) => {
        const profile = profileMap.get(item.freelancer_id);

        if (profile) {
            profile.internships.push(item);
        }
    });

    // --------------------------------------------------------
    // Attach hackathons
    // --------------------------------------------------------

    hackathons.forEach((item) => {
        const profile = profileMap.get(item.freelancer_id);

        if (profile) {
            profile.hackathons.push(item);
        }
    });

    // --------------------------------------------------------
    // Attach open source
    // --------------------------------------------------------

    openSource.forEach((item) => {
        const profile = profileMap.get(item.freelancer_id);

        if (profile) {
            profile.open_source.push(item);
        }
    });

    // --------------------------------------------------------
    // Attach assessments
    // --------------------------------------------------------

    assessments.forEach((item) => {
        const profile = profileMap.get(item.freelancer_id);

        if (profile) {
            profile.assessments.push(item);
        }
    });

    return profileMap;
};


// ============================================================
// FREELANCER: APPLY TO PROJECT
// ============================================================

const applyToProject = async (req, res) => {
    try {
        const projectId = Number(req.params.projectId);
        const userId = req.user.id;

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
            });
        }

        // --------------------------------------------------------
        // Get freelancer profile
        // --------------------------------------------------------

        const [freelancerRows] = await pool.query(
            `
            SELECT id
            FROM freelancer_profiles
            WHERE user_id = ?
            `,
            [userId]
        );

        if (freelancerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const freelancerId = freelancerRows[0].id;

        // --------------------------------------------------------
        // Get project
        // --------------------------------------------------------

        const [projectRows] = await pool.query(
            `
            SELECT
                id,
                title,
                status,
                application_open_at,
                application_close_at,
                deadline
            FROM projects
            WHERE id = ?
            `,
            [projectId]
        );

        if (projectRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const project = projectRows[0];

        // --------------------------------------------------------
        // Project must be OPEN
        // --------------------------------------------------------

        if (project.status !== 'OPEN') {
            return res.status(400).json({
                success: false,
                message: 'This project is not open for applications'
            });
        }

        // --------------------------------------------------------
        // Check application opening time
        // --------------------------------------------------------

        if (
            project.application_open_at &&
            new Date() < new Date(project.application_open_at)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Applications have not opened yet'
            });
        }

        // --------------------------------------------------------
        // Check application closing time
        // --------------------------------------------------------

        if (
            project.application_close_at &&
            new Date() > new Date(project.application_close_at)
        ) {
            return res.status(400).json({
                success: false,
                message: 'The application period has closed'
            });
        }

        // --------------------------------------------------------
        // Check project deadline
        // --------------------------------------------------------

        if (
            project.deadline &&
            new Date() >= new Date(project.deadline)
        ) {
            return res.status(400).json({
                success: false,
                message: 'The project deadline has passed'
            });
        }

        // --------------------------------------------------------
        // Check duplicate application
        // --------------------------------------------------------

        const [existingApplications] = await pool.query(
            `
            SELECT id, status
            FROM project_applications
            WHERE project_id = ?
              AND freelancer_id = ?
            `,
            [projectId, freelancerId]
        );

        if (existingApplications.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'You have already applied to this project',
                application: existingApplications[0]
            });
        }

        // --------------------------------------------------------
        // Calculate and store project-specific candidate score
        // --------------------------------------------------------

        await calculateAndStoreProjectCandidateScore({
            projectId,
            freelancerId
        });

        // --------------------------------------------------------
        // Create application
        // --------------------------------------------------------

        const [result] = await pool.query(
            `
            INSERT INTO project_applications (
                project_id,
                freelancer_id,
                status
            )
            VALUES (?, ?, 'APPLIED')
            `,
            [projectId, freelancerId]
        );

        return res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application: {
                id: result.insertId,
                project_id: projectId,
                freelancer_id: freelancerId,
                status: 'APPLIED'
            }
        });

    } catch (error) {
        console.error('Apply to project error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to apply to project'
        });
    }
};


// ============================================================
// FREELANCER: GET MY APPLICATIONS
// ============================================================

const getMyApplications = async (req, res) => {
    try {
        const userId = req.user.id;

        // --------------------------------------------------------
        // Get freelancer profile
        // --------------------------------------------------------

        const [freelancerRows] = await pool.query(
            `
            SELECT id
            FROM freelancer_profiles
            WHERE user_id = ?
            `,
            [userId]
        );

        if (freelancerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const freelancerId = freelancerRows[0].id;

        // --------------------------------------------------------
        // Get applications
        // --------------------------------------------------------

        const [applications] = await pool.query(
            `
            SELECT
                pa.id,
                pa.project_id,
                p.title,
                p.description,
                p.budget_min,
                p.budget_max,
                p.application_open_at,
                p.application_close_at,
                p.deadline,
                p.status AS project_status,
                pa.status AS application_status,
                pa.applied_at,
                pa.updated_at
            FROM project_applications pa
            INNER JOIN projects p
                ON p.id = pa.project_id
            WHERE pa.freelancer_id = ?
            ORDER BY pa.applied_at DESC
            `,
            [freelancerId]
        );

        return res.status(200).json({
            success: true,
            applications
        });

    } catch (error) {
        console.error('Get my applications error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch applications'
        });
    }
};


// ============================================================
// CLIENT: GET PROJECT APPLICATIONS
// ============================================================

const getProjectApplications = async (req, res) => {
    try {
        const projectId = Number(req.params.projectId);
        const userId = req.user.id;

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
            });
        }

        // --------------------------------------------------------
        // Verify project exists and belongs to client
        // --------------------------------------------------------

        const [projectRows] = await pool.query(
            `
            SELECT
                id,
                title,
                status,
                application_open_at,
                application_close_at,
                deadline
            FROM projects
            WHERE id = ?
              AND client_id = ?
            `,
            [projectId, userId]
        );

        if (projectRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or access denied'
            });
        }

        const project = projectRows[0];

        // --------------------------------------------------------
        // Check whether deadline has passed
        // --------------------------------------------------------

       const applicationsClosed =
    project.application_close_at !== null &&
    new Date() >= new Date(project.application_close_at);

        // ========================================================
        // BEFORE DEADLINE
        // ========================================================

        if (!applicationsClosed) {

            const [applications] = await pool.query(
                `
                SELECT
                    pa.id,
                    pa.project_id,
                    pa.freelancer_id,
                    pa.status,
                    pa.applied_at,
                    pa.updated_at
                FROM project_applications pa
                WHERE pa.project_id = ?
                ORDER BY pa.applied_at ASC
                `,
                [projectId]
            );

            return res.status(200).json({
                success: true,
                ranking_visible: true,
                applications_closed:true,
                project: {
                    id: project.id,
                    title: project.title,
                    status: project.status,
                    application_close_at: project.application_close_at,
                    deadline: project.deadline
                },
                applications
            });
        }

        // ========================================================
        // AFTER DEADLINE
        //
        // Fetch STORED scores only.
        // DO NOT recalculate.
        // ========================================================

        const [applications] = await pool.query(
            `
            SELECT
                pa.id,
                pa.project_id,
                pa.freelancer_id,
                pa.status,
                pa.applied_at,
                pa.updated_at,

                pcs.project_score,
                pcs.education_score,
                pcs.dynamic_test_score,
                pcs.github_activity_score,
                pcs.communication_score,
                pcs.experience_score,
                pcs.others_composite_score,
                pcs.candidate_quality_score,
                pcs.model_score,
                pcs.model_version,
                pcs.calculated_at

            FROM project_applications pa

            LEFT JOIN project_candidate_scores pcs
                ON pcs.project_id = pa.project_id
                AND pcs.freelancer_id = pa.freelancer_id

            WHERE pa.project_id = ?

            ORDER BY
                pcs.model_score IS NULL ASC,
                pcs.model_score DESC,
                pa.applied_at ASC
            `,
            [projectId]
        );

        // --------------------------------------------------------
        // Get complete freelancer profiles
        // --------------------------------------------------------

        const freelancerIds = [
            ...new Set(
                applications.map(
                    (application) => application.freelancer_id
                )
            )
        ];

        const freelancerProfiles =
            await getFullFreelancerProfiles(freelancerIds);

        // --------------------------------------------------------
        // Add ranking position + full profile
        // --------------------------------------------------------

        const rankedApplications = applications.map(
    (application, index) => ({
        rank: index + 1,

        id: application.id,
        project_id: application.project_id,
        freelancer_id: application.freelancer_id,
        status: application.status,
        applied_at: application.applied_at,
        updated_at: application.updated_at,

        freelancer_profile:
            freelancerProfiles.get(
                application.freelancer_id
            ) || null
    })
);

        return res.status(200).json({
            success: true,
            ranking_visible: true,
            deadline_passed: true,
            project: {
                id: project.id,
                title: project.title,
                status: project.status,
                application_close_at:
                    project.application_close_at,
                deadline: project.deadline
            },
            applications: rankedApplications
        });

    } catch (error) {
        console.error(
            'Get project applications error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch project applications'
        });
    }
};


// ============================================================
// CLIENT: UPDATE APPLICATION STATUS
// ============================================================

const updateApplicationStatus = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const applicationId = Number(req.params.applicationId);
        const userId = req.user.id;
        const { status } = req.body;

        if (!Number.isInteger(applicationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application ID'
            });
        }

        const allowedStatuses = [
            'SHORTLISTED',
            'NOT_ACCEPTED',
            'REJECTED',
            'HIRED'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application status'
            });
        }

        await connection.beginTransaction();

        // --------------------------------------------------------
        // Get application and verify client ownership
        // --------------------------------------------------------

        const [applicationRows] = await connection.query(
            `
            SELECT
                pa.id,
                pa.project_id,
                pa.freelancer_id,
                pa.status,
                p.client_id,
                p.application_close_at,
                p.deadline,
                p.status AS project_status
            FROM project_applications pa
            INNER JOIN projects p
                ON p.id = pa.project_id
            WHERE pa.id = ?
              AND p.client_id = ?
            FOR UPDATE
            `,
            [applicationId, userId]
        );

        if (applicationRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Application not found or access denied'
            });
        }

        const application = applicationRows[0];

        // --------------------------------------------------------
        // Client can manage candidates only after deadline
        // --------------------------------------------------------
        
        if (
    application.application_close_at &&
    new Date() < new Date(application.application_close_at)
) {
    await connection.rollback();

    return res.status(400).json({
        success: false,
        message:
            'You can manage candidates only after applications close'
    });
}
        // ========================================================
        // SHORTLIST
        // APPLIED -> SHORTLISTED
        // ========================================================

        if (status === 'SHORTLISTED') {

            if (application.status !== 'APPLIED') {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        'Only an applied candidate can be shortlisted'
                });
            }

            // Only one candidate can be shortlisted at a time

            const [existingShortlisted] =
                await connection.query(
                    `
                    SELECT id
                    FROM project_applications
                    WHERE project_id = ?
                      AND status = 'SHORTLISTED'
                      AND id != ?
                    LIMIT 1
                    `,
                    [
                        application.project_id,
                        applicationId
                    ]
                );

            if (existingShortlisted.length > 0) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        'Another candidate is already shortlisted for this project'
                });
            }

            await connection.query(
                `
                UPDATE project_applications
                SET status = 'SHORTLISTED'
                WHERE id = ?
                `,
                [applicationId]
            );

            await connection.commit();

            return res.status(200).json({
                success: true,
                message: 'Candidate shortlisted successfully',
                application: {
                    id: application.id,
                    project_id: application.project_id,
                    freelancer_id: application.freelancer_id,
                    previous_status: application.status,
                    status: 'SHORTLISTED'
                }
            });
        }

        // ========================================================
        // NOT ACCEPTED
        // SHORTLISTED -> NOT_ACCEPTED
        // ========================================================

        if (status === 'NOT_ACCEPTED') {

            if (application.status !== 'SHORTLISTED') {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        'Only a shortlisted candidate can be marked as not accepted'
                });
            }

            await connection.query(
                `
                UPDATE project_applications
                SET status = 'NOT_ACCEPTED'
                WHERE id = ?
                `,
                [applicationId]
            );

            await connection.commit();

            return res.status(200).json({
                success: true,
                message:
                    'Candidate did not accept. You can select another freelancer.',
                application: {
                    id: application.id,
                    project_id: application.project_id,
                    freelancer_id: application.freelancer_id,
                    previous_status: application.status,
                    status: 'NOT_ACCEPTED'
                }
            });
        }

        // ========================================================
        // REJECT
        // APPLIED or SHORTLISTED -> REJECTED
        // ========================================================

        if (status === 'REJECTED') {

            if (
                application.status !== 'APPLIED' &&
                application.status !== 'SHORTLISTED'
            ) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        'This candidate cannot be rejected in the current state'
                });
            }

            await connection.query(
                `
                UPDATE project_applications
                SET status = 'REJECTED'
                WHERE id = ?
                `,
                [applicationId]
            );

            await connection.commit();

            return res.status(200).json({
                success: true,
                message: 'Candidate rejected successfully',
                application: {
                    id: application.id,
                    project_id: application.project_id,
                    freelancer_id: application.freelancer_id,
                    previous_status: application.status,
                    status: 'REJECTED'
                }
            });
        }

        // ========================================================
        // HIRE
        // SHORTLISTED -> HIRED
        //
        // After hiring:
        // selected candidate -> HIRED
        // everyone else -> REJECTED
        // project -> COMPLETED
        // ========================================================

        if (status === 'HIRED') {

            if (application.status !== 'SHORTLISTED') {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        'Only a shortlisted candidate can be hired'
                });
            }

            // Check if another freelancer is already hired

            const [existingHired] =
                await connection.query(
                    `
                    SELECT id
                    FROM project_applications
                    WHERE project_id = ?
                      AND status = 'HIRED'
                      AND id != ?
                    LIMIT 1
                    `,
                    [
                        application.project_id,
                        applicationId
                    ]
                );

            if (existingHired.length > 0) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        'A freelancer has already been hired for this project'
                });
            }

            // Hire selected freelancer

            await connection.query(
                `
                UPDATE project_applications
                SET status = 'HIRED'
                WHERE id = ?
                `,
                [applicationId]
            );

            // Reject all remaining candidates

            await connection.query(
                `
                UPDATE project_applications
                SET status = 'REJECTED'
                WHERE project_id = ?
                  AND id != ?
                  AND status IN (
                      'APPLIED',
                      'SHORTLISTED'
                  )
                `,
                [
                    application.project_id,
                    applicationId
                ]
            );

            // Project automatically becomes COMPLETED

            await connection.query(
                `
                UPDATE projects
                SET status = 'COMPLETED'
                WHERE id = ?
                `,
                [application.project_id]
            );

            await connection.commit();

            return res.status(200).json({
                success: true,
                message:
                    'Freelancer hired successfully. All other applications have been rejected.',
                application: {
                    id: application.id,
                    project_id: application.project_id,
                    freelancer_id: application.freelancer_id,
                    previous_status: application.status,
                    status: 'HIRED'
                }
            });
        }

    } catch (error) {
        await connection.rollback();

        console.error(
            'Update application status error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to update application status'
        });

    } finally {
        connection.release();
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    applyToProject,
    getMyApplications,
    getProjectApplications,
    updateApplicationStatus
};