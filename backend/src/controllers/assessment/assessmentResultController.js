const pool = require('../../config/db');

const getAssessmentResult = async (req, res) => {
    try {
        const freelancerUserId = req.user.id;
        const assessmentId = req.params.id;

        // Get freelancer profile
        const [profiles] = await pool.execute(
            `
            SELECT id
            FROM freelancer_profiles
            WHERE user_id = ?
            `,
            [freelancerUserId]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const freelancerId = profiles[0].id;

        // Get assessment belonging to this freelancer
        const [assessments] = await pool.execute(
            `
            SELECT
                a.id,
                a.assessment_type,
                a.skill_id,
                s.name AS skill_name,
                a.score,
                a.communication_score,
                a.started_at,
                a.completed_at,
                a.expires_at,
                a.status
            FROM assessments a
            JOIN skills s
                ON s.id = a.skill_id
            WHERE a.id = ?
              AND a.freelancer_id = ?
            LIMIT 1
            `,
            [assessmentId, freelancerId]
        );

        if (assessments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Assessment not found'
            });
        }

        const assessment = assessments[0];

        return res.status(200).json({
            success: true,
            assessment: {
                id: assessment.id,
                assessment_type: assessment.assessment_type,
                skill: {
                    id: assessment.skill_id,
                    name: assessment.skill_name
                },
                score: assessment.score,
                communication_score: assessment.communication_score,
                started_at: assessment.started_at,
                completed_at: assessment.completed_at,
                expires_at: assessment.expires_at,
                status: assessment.status
            }
        });

    } catch (error) {
        console.error('Get assessment result error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch assessment result'
        });
    }
};
const getAssessmentHistory = async (req, res) => {
    try {
        const freelancerUserId = req.user.id;

        const [profiles] = await pool.execute(
            `
            SELECT id
            FROM freelancer_profiles
            WHERE user_id = ?
            `,
            [freelancerUserId]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }

        const freelancerId = profiles[0].id;

        const [assessments] = await pool.execute(
            `
            SELECT
                a.id,
                a.assessment_type,
                a.skill_id,
                s.name AS skill_name,
                a.score,
                a.communication_score,
                a.started_at,
                a.completed_at,
                a.expires_at,
                a.status
            FROM assessments a
            JOIN skills s
                ON s.id = a.skill_id
            WHERE a.freelancer_id = ?
            ORDER BY a.started_at DESC
            `,
            [freelancerId]
        );

        return res.status(200).json({
            success: true,
            count: assessments.length,
            assessments: assessments.map((assessment) => ({
                id: assessment.id,
                assessment_type: assessment.assessment_type,
                skill: {
                    id: assessment.skill_id,
                    name: assessment.skill_name
                },
                score: assessment.score,
                communication_score: assessment.communication_score,
                started_at: assessment.started_at,
                completed_at: assessment.completed_at,
                expires_at: assessment.expires_at,
                status: assessment.status
            }))
        });

    } catch (error) {
        console.error('Get assessment history error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch assessment history'
        });
    }
};

module.exports = {
    getAssessmentResult,   
    getAssessmentHistory

};