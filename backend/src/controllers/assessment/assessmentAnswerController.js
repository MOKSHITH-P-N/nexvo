const pool = require('../../config/db');

const saveAssessmentAnswer = async (req, res) => {
    try {
        const freelancerUserId = req.user.id;
        const assessmentId = req.params.id;

        const {
            question_id,
            answer
        } = req.body;

        if (!question_id || !answer) {
            return res.status(400).json({
                success: false,
                message: 'question_id and answer are required'
            });
        }

        const validAnswers = ['A', 'B', 'C', 'D'];

        if (!validAnswers.includes(answer)) {
            return res.status(400).json({
                success: false,
                message: 'Answer must be A, B, C or D'
            });
        }

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
                id,
                status,
                expires_at
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
            return res.status(409).json({
                success: false,
                message: 'This assessment is no longer active'
            });
        }

        if (new Date() > new Date(assessment.expires_at)) {
            await pool.execute(
                `
                UPDATE assessments
                SET status = 'EXPIRED'
                WHERE id = ?
                `,
                [assessmentId]
            );

            return res.status(409).json({
                success: false,
                message: 'Assessment time has expired'
            });
        }

        const [questionRows] = await pool.execute(
            `
            SELECT questions
            FROM assessment_questions
            WHERE assessment_id = ?
            LIMIT 1
            `,
            [assessmentId]
        );

        if (questionRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Assessment questions not found'
            });
        }

        const questions =
            typeof questionRows[0].questions === 'string'
                ? JSON.parse(questionRows[0].questions)
                : questionRows[0].questions;

        const questionExists = questions.some(
            question =>
                Number(question.id) === Number(question_id)
        );

        if (!questionExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid question_id for this assessment'
            });
        }

        const [answerRows] = await pool.execute(
            `
            SELECT answers
            FROM assessment_answers
            WHERE assessment_id = ?
            LIMIT 1
            `,
            [assessmentId]
        );

        let answers = {};

        if (answerRows.length > 0) {
            answers =
                typeof answerRows[0].answers === 'string'
                    ? JSON.parse(answerRows[0].answers)
                    : answerRows[0].answers;
        }

        answers[String(question_id)] = answer;

        if (answerRows.length === 0) {
            await pool.execute(
                `
                INSERT INTO assessment_answers
                (
                    assessment_id,
                    answers
                )
                VALUES (?, ?)
                `,
                [
                    assessmentId,
                    JSON.stringify(answers)
                ]
            );
        } else {
            await pool.execute(
                `
                UPDATE assessment_answers
                SET answers = ?
                WHERE assessment_id = ?
                `,
                [
                    JSON.stringify(answers),
                    assessmentId
                ]
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Answer saved successfully',
            question_id: Number(question_id),
            answer
        });

    } catch (error) {
        console.error('Save assessment answer error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to save answer'
        });
    }
};

module.exports = {
    saveAssessmentAnswer
};
