const pool = require('../../config/db');

const {
    generateAssessmentQuestions
} = require('../../services/openrouterService');

const ASSESSMENT_DURATION_MINUTES = 20;
const ASSESSMENT_QUESTION_COUNT = 20;

const EXPIRED_RETAKE_COOLDOWN_MONTHS = 6;
const VIOLATION_RETAKE_COOLDOWN_MONTHS = 1;


const startAssessment = async (req, res) => {
    try {

        const freelancerUserId = req.user.id;

        const {
            assessment_type = 'TECHNICAL',
            skill_id
        } = req.body;

        // --------------------------------------------------
        // FIXED ASSESSMENT CONFIGURATION
        // --------------------------------------------------

        const question_count = ASSESSMENT_QUESTION_COUNT;

        // --------------------------------------------------
        // VALIDATION
        // --------------------------------------------------

        if (!skill_id) {
            return res.status(400).json({
                success: false,
                message: 'skill_id is required'
            });
        }

        // Assessment always contains exactly 20 questions.
        if (question_count !== 20) {
            return res.status(500).json({
                success: false,
                message: 'Assessment configuration error'
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
        // VERIFY FREELANCER HAS SELECTED SKILL
        // --------------------------------------------------

        const [skills] = await pool.execute(
            `
            SELECT
                s.id,
                s.name
            FROM freelancer_skills fs
            JOIN skills s
                ON s.id = fs.skill_id
            WHERE fs.freelancer_id = ?
              AND fs.skill_id = ?
            `,
            [freelancerId, skill_id]
        );

        if (skills.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Selected skill is not registered by this freelancer'
            });
        }

        const skillName = skills[0].name;

        // --------------------------------------------------
        // CHECK FOR EXISTING IN-PROGRESS ASSESSMENT
        // --------------------------------------------------

        const [inProgress] = await pool.execute(
            `
            SELECT
                id,
                skill_id,
                started_at,
                expires_at,
                status
            FROM assessments
            WHERE freelancer_id = ?
              AND skill_id = ?
              AND assessment_type = ?
              AND status = 'IN_PROGRESS'
            ORDER BY started_at DESC
            LIMIT 1
            `,
            [freelancerId, skill_id, assessment_type]
        );

        if (inProgress.length > 0) {

            const existingAssessment = inProgress[0];

            // --------------------------------------------------
            // CHECK IF CURRENT ASSESSMENT TIMER HAS EXPIRED
            // --------------------------------------------------

            if (
                existingAssessment.expires_at &&
                new Date(existingAssessment.expires_at) <= new Date()
            ) {

                const retryAvailableAt = new Date(
                    existingAssessment.expires_at
                );

                retryAvailableAt.setMonth(
                    retryAvailableAt.getMonth() +
                    EXPIRED_RETAKE_COOLDOWN_MONTHS
                );

                await pool.execute(
                    `
                    UPDATE assessments
                    SET
                        status = 'EXPIRED',
                        retry_available_at = ?
                    WHERE id = ?
                    `,
                    [
                        retryAvailableAt,
                        existingAssessment.id
                    ]
                );

                return res.status(409).json({
                    success: false,
                    message:
                        'Assessment has expired. You can retake this assessment after 6 months.',
                    assessment_id: existingAssessment.id,
                    status: 'EXPIRED',
                    retry_available_at: retryAvailableAt
                });
            }

            // --------------------------------------------------
            // RESUME EXISTING ASSESSMENT
            // --------------------------------------------------

            const [questionRows] = await pool.execute(
                `
                SELECT questions
                FROM assessment_questions
                WHERE assessment_id = ?
                `,
                [existingAssessment.id]
            );

            if (questionRows.length === 0) {
                return res.status(500).json({
                    success: false,
                    message: 'Assessment questions not found'
                });
            }

            const questions =
                typeof questionRows[0].questions === 'string'
                    ? JSON.parse(questionRows[0].questions)
                    : questionRows[0].questions;

            // --------------------------------------------------
            // VERIFY EXISTING ASSESSMENT HAS EXACTLY 20 QUESTIONS
            // --------------------------------------------------

            if (
                !Array.isArray(questions) ||
                questions.length !== ASSESSMENT_QUESTION_COUNT
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        'Invalid assessment configuration: assessment must contain exactly 20 questions'
                });
            }

            // --------------------------------------------------
            // LOAD SAVED ANSWERS
            // --------------------------------------------------

            const [answerRows] = await pool.execute(
                `
                SELECT answers
                FROM assessment_answers
                WHERE assessment_id = ?
                `,
                [existingAssessment.id]
            );

            let savedAnswers = {};

            if (answerRows.length > 0) {
                savedAnswers =
                    typeof answerRows[0].answers === 'string'
                        ? JSON.parse(answerRows[0].answers)
                        : answerRows[0].answers;
            }

            // --------------------------------------------------
            // REMOVE CORRECT ANSWERS BEFORE SENDING TO FRONTEND
            // --------------------------------------------------

            const questionsForFrontend = questions.map(
                (question) => ({
                    id: question.id,
                    question: question.question,
                    options: question.options,
                    marks: question.marks
                })
            );

            // --------------------------------------------------
            // RETURN EXISTING ASSESSMENT
            // --------------------------------------------------

            return res.status(200).json({
                success: true,
                message: 'Existing assessment resumed successfully',

                assessment: {
                    id: existingAssessment.id,
                    assessment_type,

                    skill: {
                        id: skill_id,
                        name: skillName
                    },

                    question_count: ASSESSMENT_QUESTION_COUNT,

                    duration_minutes:
                        ASSESSMENT_DURATION_MINUTES,

                    started_at:
                        existingAssessment.started_at,

                    expires_at:
                        existingAssessment.expires_at,

                    status: 'IN_PROGRESS'
                },

                questions: questionsForFrontend,

                answers: savedAnswers
            });
        }

        // --------------------------------------------------
        // CHECK EXPIRED / VIOLATION COOLDOWN
        // --------------------------------------------------

        const [restrictedAttempts] = await pool.execute(
            `
            SELECT
                id,
                status,
                retry_available_at
            FROM assessments
            WHERE freelancer_id = ?
              AND skill_id = ?
              AND assessment_type = ?
              AND status IN ('EXPIRED', 'VIOLATION')
              AND retry_available_at IS NOT NULL
              AND retry_available_at > NOW()
            ORDER BY retry_available_at DESC
            LIMIT 1
            `,
            [freelancerId, skill_id, assessment_type]
        );

        if (restrictedAttempts.length > 0) {

            const restricted = restrictedAttempts[0];

            if (restricted.status === 'EXPIRED') {

                return res.status(409).json({
                    success: false,
                    message:
                        'Your previous assessment expired. You can retake it after 6 months.',
                    assessment_id: restricted.id,
                    status: 'EXPIRED',
                    retry_available_at:
                        restricted.retry_available_at
                });
            }

            if (restricted.status === 'VIOLATION') {

                return res.status(409).json({
                    success: false,
                    message:
                        'Your previous assessment was terminated due to violations. You can retake it after 1 month.',
                    assessment_id: restricted.id,
                    status: 'VIOLATION',
                    retry_available_at:
                        restricted.retry_available_at
                });
            }
        }

        // --------------------------------------------------
        // CHECK FOR VALID COMPLETED ASSESSMENT
        // --------------------------------------------------

        const [completed] = await pool.execute(
            `
            SELECT
                id,
                score,
                completed_at,
                expires_at
            FROM assessments
            WHERE freelancer_id = ?
              AND skill_id = ?
              AND assessment_type = ?
              AND status = 'COMPLETED'
              AND expires_at > NOW()
            ORDER BY completed_at DESC
            LIMIT 1
            `,
            [freelancerId, skill_id, assessment_type]
        );

        if (completed.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    'You already have a valid completed assessment for this skill',
                assessment_id: completed[0].id,
                score: completed[0].score,
                completed_at: completed[0].completed_at,
                expires_at: completed[0].expires_at
            });
        }

        // --------------------------------------------------
        // CREATE NEW ASSESSMENT
        // --------------------------------------------------

        const generatedAssessment =
            await generateAssessmentQuestions(
                skillName
            );

        // --------------------------------------------------
        // FINAL BACKEND SAFETY CHECK
        // --------------------------------------------------

        if (
            !generatedAssessment ||
            !Array.isArray(generatedAssessment.questions) ||
            generatedAssessment.questions.length !==
                ASSESSMENT_QUESTION_COUNT
        ) {
            return res.status(500).json({
                success: false,
                message:
                    'Assessment generation failed: exactly 20 questions are required'
            });
        }

        const startedAt = new Date();

        const expiresAt = new Date(
            startedAt.getTime() +
            ASSESSMENT_DURATION_MINUTES * 60 * 1000
        );

        // --------------------------------------------------
        // INSERT ASSESSMENT
        // --------------------------------------------------

        const [assessmentResult] = await pool.execute(
            `
            INSERT INTO assessments
            (
                freelancer_id,
                skill_id,
                assessment_type,
                score,
                communication_score,
                started_at,
                expires_at,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                freelancerId,
                skill_id,
                assessment_type,
                0,
                null,
                startedAt,
                expiresAt,
                'IN_PROGRESS'
            ]
        );

        const assessmentId = assessmentResult.insertId;

        // --------------------------------------------------
        // STORE QUESTIONS
        // --------------------------------------------------

        await pool.execute(
            `
            INSERT INTO assessment_questions
            (
                assessment_id,
                questions
            )
            VALUES (?, ?)
            `,
            [
                assessmentId,
                JSON.stringify(generatedAssessment.questions)
            ]
        );

        // --------------------------------------------------
        // REMOVE CORRECT ANSWERS BEFORE SENDING TO FRONTEND
        // --------------------------------------------------

        const questionsForFrontend =
            generatedAssessment.questions.map(
                (question) => ({
                    id: question.id,
                    question: question.question,
                    options: question.options,
                    marks: question.marks
                })
            );

        // --------------------------------------------------
        // RETURN NEW ASSESSMENT
        // --------------------------------------------------

        return res.status(201).json({
            success: true,
            message: 'Assessment started successfully',

            assessment: {
                id: assessmentId,

                assessment_type,

                skill: {
                    id: skill_id,
                    name: skillName
                },

                question_count:
                    ASSESSMENT_QUESTION_COUNT,

                duration_minutes:
                    ASSESSMENT_DURATION_MINUTES,

                started_at: startedAt,

                expires_at: expiresAt,

                status: 'IN_PROGRESS'
            },

            questions: questionsForFrontend,

            answers: {}
        });

    } catch (error) {

        console.error(
            'Start assessment error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to start assessment'
        });
    }
};


module.exports = {
    startAssessment
};