const pool = require('../../config/db');

const recordAssessmentViolation = async (req, res) => {
    try {
        const freelancerUserId = req.user.id;
        const assessmentId = req.params.id;
        const { violation_type } = req.body;

        if (!violation_type) {
            return res.status(400).json({
                success: false,
                message: 'violation_type is required'
            });
        }

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

        // Verify assessment belongs to freelancer
        const [assessments] = await pool.execute(
            `
            SELECT id, status, expires_at
            FROM assessments
            WHERE id = ?
              AND freelancer_id = ?
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

        if (assessment.status !== 'IN_PROGRESS') {
            return res.status(400).json({
                success: false,
                message: 'Assessment is no longer active'
            });
        }

        // Check assessment timer
        if (
            assessment.expires_at &&
            new Date(assessment.expires_at) <= new Date()
        ) {
            await pool.execute(
                `
                UPDATE assessments
                SET status = 'EXPIRED'
                WHERE id = ?
                `,
                [assessmentId]
            );

            return res.status(400).json({
                success: false,
                message: 'Assessment has expired'
            });
        }

        // Record violation
        await pool.execute(
            `
            INSERT INTO assessment_violations
                (assessment_id, violation_type)
            VALUES (?, ?)
            `,
            [assessmentId, violation_type]
        );

        // Count violations
        const [violationRows] = await pool.execute(
            `
            SELECT COUNT(*) AS violation_count
            FROM assessment_violations
            WHERE assessment_id = ?
            `,
            [assessmentId]
        );

        const violationCount = Number(violationRows[0].violation_count);

        // Third violation terminates assessment
        if (violationCount >= 3) {
            await pool.execute(
                `
                UPDATE assessments
                SET
                    status = 'VIOLATION',
                    retry_available_at = DATE_ADD(NOW(), INTERVAL 1 MONTH),
                    completed_at = NOW(),
                    score = NULL,
                    communication_score = NULL
                WHERE id = ?
                `,
                [assessmentId]
            );

            return res.status(200).json({
                success: true,
                message: 'Assessment terminated due to excessive violations',
                status: 'VIOLATION',
                violation_count: violationCount,
                retry_available_at: new Date(
                    new Date().setMonth(new Date().getMonth() + 1)
                )
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Violation recorded',
            status: 'IN_PROGRESS',
            violation_count: violationCount
        });

    } catch (error) {
        console.error('Record assessment violation error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to record assessment violation'
        });
    }
};

module.exports = {
    recordAssessmentViolation
};