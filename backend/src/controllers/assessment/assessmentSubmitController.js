const pool = require('../../config/db');

const {
    recalculateCandidateScores
} = require('../../services/freelancerScoreService');


const submitAssessment = async (req, res) => {
    try {
        const freelancerUserId = req.user.id;
        const assessmentId = Number(req.params.id);

        if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assessment ID'
            });
        }


        // --------------------------------------------------
        // GET FREELANCER PROFILE
        // --------------------------------------------------

        const [profiles] = await pool.execute(
            `
            SELECT id
            FROM freelancer_profiles
            WHERE user_id = ?
            LIMIT 1
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


        // --------------------------------------------------
        // GET ASSESSMENT
        // --------------------------------------------------

        const [assessments] = await pool.execute(
            `
            SELECT
                id,
                freelancer_id,
                status,
                expires_at
            FROM assessments
            WHERE id = ?
              AND freelancer_id = ?
            LIMIT 1
            `,
            [
                assessmentId,
                freelancerId
            ]
        );

        if (assessments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Assessment not found'
            });
        }

        const assessment = assessments[0];


        // --------------------------------------------------
        // CHECK STATUS
        // --------------------------------------------------

        if (assessment.status !== 'IN_PROGRESS') {
            return res.status(409).json({
                success: false,
                message: `Assessment is already ${assessment.status}`,
                status: assessment.status
            });
        }


        // --------------------------------------------------
        // DETERMINE WHETHER TIMER HAS EXPIRED
        // --------------------------------------------------

        const isExpired =
            assessment.expires_at &&
            new Date() > new Date(assessment.expires_at);


        // --------------------------------------------------
        // GET QUESTIONS
        // --------------------------------------------------

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


        if (
            !Array.isArray(questions) ||
            questions.length === 0
        ) {
            return res.status(500).json({
                success: false,
                message: 'Assessment contains no questions'
            });
        }


        // --------------------------------------------------
        // GET SAVED ANSWERS
        // --------------------------------------------------

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


        // --------------------------------------------------
        // CALCULATE SCORE
        // --------------------------------------------------

        let score = 0;
        let answeredQuestions = 0;

        for (const question of questions) {

            const questionId = String(question.id);

            const submittedAnswer =
                answers[questionId] !== undefined
                    ? String(answers[questionId])
                        .trim()
                        .toUpperCase()
                    : null;

            const correctAnswer =
                question.correct_answer !== undefined
                    ? String(question.correct_answer)
                        .trim()
                        .toUpperCase()
                    : null;


            // Count valid submitted answers
            if (
                submittedAnswer &&
                ['A', 'B', 'C', 'D'].includes(
                    submittedAnswer
                )
            ) {
                answeredQuestions++;
            }


            // Add marks for correct answers
            if (
                submittedAnswer &&
                correctAnswer &&
                submittedAnswer === correctAnswer
            ) {
                score += Number(question.marks) || 0;
            }
        }


        // --------------------------------------------------
        // TOTAL MARKS
        // --------------------------------------------------

        const totalMarks = questions.reduce(
            (total, question) => {
                return total + (
                    Number(question.marks) || 0
                );
            },
            0
        );


        // --------------------------------------------------
        // PERCENTAGE
        // --------------------------------------------------

        const percentage =
            totalMarks > 0
                ? Number(
                    (
                        (score / totalMarks) * 100
                    ).toFixed(2)
                )
                : 0;


        // --------------------------------------------------
        // COMPLETION TIME
        // --------------------------------------------------

        const completedAt = new Date();


        // --------------------------------------------------
        // DETERMINE FINAL STATUS
        // --------------------------------------------------

        const finalStatus = isExpired
            ? 'EXPIRED'
            : 'COMPLETED';


        // --------------------------------------------------
        // VALIDITY DATE
        //
        // COMPLETED assessments get 6-month validity.
        //
        // EXPIRED assessments keep their original
        // assessment expiry time.
        // --------------------------------------------------

        let validityExpiresAt;

        if (isExpired) {

            validityExpiresAt =
                new Date(assessment.expires_at);

        } else {

            validityExpiresAt =
                new Date(completedAt);

            validityExpiresAt.setMonth(
                validityExpiresAt.getMonth() + 6
            );
        }


        // --------------------------------------------------
        // UPDATE ASSESSMENT
        // --------------------------------------------------

        const [updateResult] = await pool.execute(
            `
            UPDATE assessments
            SET
                score = ?,
                completed_at = ?,
                expires_at = ?,
                status = ?
            WHERE id = ?
              AND freelancer_id = ?
              AND status = 'IN_PROGRESS'
            `,
            [
                score,
                completedAt,
                validityExpiresAt,
                finalStatus,
                assessmentId,
                freelancerId
            ]
        );


        // --------------------------------------------------
        // VERIFY DATABASE UPDATE
        // --------------------------------------------------

        if (updateResult.affectedRows === 0) {
            return res.status(409).json({
                success: false,
                message:
                    'Assessment could not be finalized'
            });
        }


        // --------------------------------------------------
        // RECALCULATE CANDIDATE SCORE
        // --------------------------------------------------

        try {

            await recalculateCandidateScores(
                freelancerId
            );

        } catch (scoreError) {

            console.error(
                'Candidate score recalculation error:',
                scoreError
            );

            // Assessment has already been safely finalized.
            // Do not turn a successful assessment submission
            // into a 500 response because score recalculation
            // failed.
        }


        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        return res.status(200).json({
            success: true,

            message: isExpired
                ? 'Assessment time expired and answers were automatically submitted'
                : 'Assessment submitted successfully',

            result: {
                assessment_id: assessmentId,

                score,

                total_marks: totalMarks,

                answered_questions:
                    answeredQuestions,

                total_questions:
                    questions.length,

                percentage,

                completed_at:
                    completedAt,

                valid_until:
                    validityExpiresAt,

                status: finalStatus
            }
        });


    } catch (error) {

        console.error(
            'Submit assessment error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to submit assessment',
            error: error.message
        });
    }
};


module.exports = {
    submitAssessment
};