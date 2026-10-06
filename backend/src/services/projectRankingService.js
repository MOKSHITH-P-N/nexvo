const pool = require('../config/db');

const MODEL_VERSION = 'candidate-quality-v1';

const MIN_PROJECT_SCORE = 27.6;
const MAX_PROJECT_SCORE = 98.4;

const MIN_OTHERS_SCORE = 22.5;
const MAX_OTHERS_SCORE = 92.0;

const SENIOR_YEARS_THRESHOLD = 3;

const ML_SERVICE_URL =
    process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';


/* =========================================================
   HELPERS
========================================================= */

const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};

const round = (value, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
};

const calculateMonthsBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
    ) {
        return 0;
    }

    const milliseconds = end.getTime() - start.getTime();

    return milliseconds / (1000 * 60 * 60 * 24 * 30.4375);
};


/* =========================================================
   EXPERIENCE
========================================================= */

const calculateExperienceScore = (yearsExperience) => {
    const years = clamp(
        Number(yearsExperience) || 0,
        0,
        12
    );

    if (years >= SENIOR_YEARS_THRESHOLD) {
        return round((years / 12) * 100);
    }

    return round(
        Math.min((years / 2.5) * 100, 100)
    );
};


/* =========================================================
   PROJECT SCORE
========================================================= */

const calculateProjectScore = ({
    portfolioProjects,
    freelancerSkillIds,
    projectSkills
}) => {
    if (!portfolioProjects || portfolioProjects.length === 0) {
        return MIN_PROJECT_SCORE;
    }

    const numProjects = portfolioProjects.length;

    const numNorm =
        Math.min(numProjects / 10, 1.0) * 100;

    let complexityTotal = 0;
    let deploymentTotal = 0;
    let starsTotal = 0;

    for (const project of portfolioProjects) {
        const complexity =
            Number(project.complexity) || 0;

        complexityTotal +=
            (clamp(complexity, 1, 5) / 5) * 100;

        deploymentTotal +=
            Number(project.has_deployment) === 1 ||
            Number(project.has_deployment) === true
                ? 100
                : 0;

        const stars =
            Number(project.github_stars) || 0;

        starsTotal +=
            Math.min(stars / 500, 1.0) * 100;
    }

    /*
     * Project-specific technology relevance.
     *
     * Each project skill has a weight.
     * A freelancer receives the weight of every
     * required skill that they possess.
     *
     * Example:
     * React 0.35
     * Node  0.25
     *
     * Freelancer has React only
     * => relevance = 35
     */

    const freelancerSkills = new Set(
        (freelancerSkillIds || []).map(id => Number(id))
    );

    let technologyRelevance = 0;

    for (const skill of projectSkills || []) {
        if (freelancerSkills.has(Number(skill.skill_id))) {
            technologyRelevance +=
                Number(skill.weight) * 100;
        }
    }

    technologyRelevance =
        clamp(technologyRelevance, 0, 100);

    const projectCount = portfolioProjects.length;

    const compNorm =
        complexityTotal / projectCount;

    const deploymentNorm =
        deploymentTotal / projectCount;

    const starsNorm =
        starsTotal / projectCount;

    let projectScore =
        0.20 * numNorm +
        0.25 * compNorm +
        0.20 * technologyRelevance +
        0.20 * deploymentNorm +
        0.15 * starsNorm;

    projectScore = clamp(
        projectScore,
        MIN_PROJECT_SCORE,
        MAX_PROJECT_SCORE
    );

    return round(projectScore);
};


/* =========================================================
   OTHERS COMPOSITE
========================================================= */

const calculateOthersCompositeScore = ({
    educationScore,
    certificationsCount,
    githubActivityScore,
    communicationScore,
    internshipMonths,
    hackathonWins,
    openSourceContributions
}) => {

    const certScore =
        (
            Math.min(
                Number(certificationsCount) || 0,
                7
            ) / 7
        ) * 100;

    const internshipScore =
        (
            clamp(
                Number(internshipMonths) || 0,
                0,
                6
            ) / 6
        ) * 100;

    const hackathonScore =
        (
            Math.min(
                Number(hackathonWins) || 0,
                4
            ) / 4
        ) * 100;

    const ossScore =
        (
            Math.min(
                Number(openSourceContributions) || 0,
                20
            ) / 20
        ) * 100;

    const extracurricularScore =
        (
            internshipScore +
            hackathonScore +
            ossScore
        ) / 3;

    let othersScore =
        0.25 * educationScore +
        0.15 * certScore +
        0.20 * githubActivityScore +
        0.20 * communicationScore +
        0.20 * extracurricularScore;

    othersScore = clamp(
        othersScore,
        MIN_OTHERS_SCORE,
        MAX_OTHERS_SCORE
    );

    return round(othersScore);
};


/* =========================================================
   DETERMINISTIC CANDIDATE QUALITY SCORE
========================================================= */

const calculateCandidateQualityScore = ({
    yearsExperience,
    dynamicTestScore,
    projectScore,
    experienceScore,
    othersCompositeScore
}) => {

    let score;

    if (
        Number(yearsExperience) >=
        SENIOR_YEARS_THRESHOLD
    ) {
        score =
            0.35 * dynamicTestScore +
            0.35 * experienceScore +
            0.20 * projectScore +
            0.10 * othersCompositeScore;
    } else {
        score =
            0.60 * dynamicTestScore +
            0.25 * projectScore +
            0.05 * experienceScore +
            0.10 * othersCompositeScore;
    }

    return round(clamp(score, 0, 100));
};


/* =========================================================
   FETCH FREELANCER DATA
========================================================= */

const getFreelancerData = async (freelancerId) => {

    const [profiles] = await pool.execute(
        `
        SELECT
            fp.id,
            fp.user_id,
            fp.years_experience,
            fp.github_url
        FROM freelancer_profiles fp
        WHERE fp.id = ?
        `,
        [freelancerId]
    );

    if (profiles.length === 0) {
        throw new Error('Freelancer profile not found');
    }

    const profile = profiles[0];


    /* ---------- EDUCATION ---------- */

    const [education] = await pool.execute(
        `
        SELECT
            fe.education_level_id,
            el.name AS education_level,
            el.education_score
        FROM freelancer_education fe
        INNER JOIN education_levels el
            ON el.id = fe.education_level_id
        WHERE fe.freelancer_id = ?
        ORDER BY el.education_score DESC
        `,
        [freelancerId]
    );

    let educationLevel = 'Unknown';
    let educationScore = 0;

    if (education.length > 0) {
        educationLevel =
            education[0].education_level;

        educationScore =
            Number(education[0].education_score) || 0;
    }


    /* ---------- SKILLS ---------- */

    const [skills] = await pool.execute(
        `
        SELECT skill_id
        FROM freelancer_skills
        WHERE freelancer_id = ?
        `,
        [freelancerId]
    );

    const freelancerSkillIds =
        skills.map(skill => Number(skill.skill_id));


    /* ---------- PORTFOLIO ---------- */

    const [portfolioProjects] = await pool.execute(
        `
        SELECT
            id,
            complexity,
            has_deployment,
            github_stars
        FROM portfolio_projects
        WHERE freelancer_id = ?
        `,
        [freelancerId]
    );


    /* ---------- CERTIFICATIONS ---------- */

    const [certificates] = await pool.execute(
        `
        SELECT COUNT(*) AS verified_count
        FROM freelancer_certificates
        WHERE freelancer_id = ?
          AND verification_status = 'VERIFIED'
        `,
        [freelancerId]
    );

    const certificationsCount =
        Number(certificates[0]?.verified_count || 0);

    const certificationsCapped =
        Math.min(certificationsCount, 7);


    /* ---------- INTERNSHIPS ---------- */

    const [internships] = await pool.execute(
        `
        SELECT
            start_date,
            end_date
        FROM freelancer_internships
        WHERE freelancer_id = ?
        `,
        [freelancerId]
    );

    let internshipMonths = 0;

    for (const internship of internships) {

        if (!internship.start_date) {
            continue;
        }

        const endDate =
            internship.end_date || new Date();

        internshipMonths +=
            calculateMonthsBetween(
                internship.start_date,
                endDate
            );
    }

    internshipMonths = round(
        clamp(internshipMonths, 0, 6)
    );


    /* ---------- HACKATHONS ---------- */

    const [hackathons] = await pool.execute(
        `
        SELECT COUNT(*) AS win_count
        FROM freelancer_hackathons
        WHERE freelancer_id = ?
          AND won = 1
        `,
        [freelancerId]
    );

    const hackathonWins =
        Math.min(
            Number(hackathons[0]?.win_count || 0),
            4
        );


    /* ---------- OPEN SOURCE ---------- */

    const [openSource] = await pool.execute(
        `
        SELECT
            COALESCE(
                SUM(contributions_count),
                0
            ) AS total_contributions
        FROM freelancer_open_source
        WHERE freelancer_id = ?
        `,
        [freelancerId]
    );

    const openSourceContributions =
        Math.min(
            Number(
                openSource[0]?.total_contributions || 0
            ),
            20
        );


    /* ---------- EXPERIENCE ---------- */

    const [experienceRecords] = await pool.execute(
        `
        SELECT
            start_date,
            end_date,
            is_current
        FROM freelancer_experience
        WHERE freelancer_id = ?
        `,
        [freelancerId]
    );

    let yearsExperience = 0;

    const now = new Date();

    for (const experience of experienceRecords) {

        if (!experience.start_date) {
            continue;
        }

        const endDate =
            experience.is_current
                ? now
                : experience.end_date;

        if (!endDate) {
            continue;
        }

        yearsExperience +=
            calculateMonthsBetween(
                experience.start_date,
                endDate
            ) / 12;
    }

    yearsExperience = round(
        clamp(yearsExperience, 0, 12)
    );


    /* ---------- GITHUB ---------- */

    const githubActivityScore =
        profile.github_url &&
        profile.github_url.trim()
            ? 100
            : 0;


    return {
        profile,
        educationLevel,
        educationScore,
        freelancerSkillIds,
        portfolioProjects,
        certificationsCount,
        certificationsCapped,
        internshipMonths,
        hackathonWins,
        openSourceContributions,
        yearsExperience,
        githubActivityScore
    };
};


/* =========================================================
   PROJECT-SPECIFIC ASSESSMENT SCORE
========================================================= */

const calculateProjectAssessmentScore = async ({
    projectId,
    freelancerId,
    projectSkills
}) => {

    if (!projectSkills || projectSkills.length === 0) {
        return {
            dynamicTestScore: 0,
            communicationScore: 0
        };
    }

    let weightedScore = 0;

    let communicationTotal = 0;
    let communicationCount = 0;

    for (const projectSkill of projectSkills) {

        const skillId =
            Number(projectSkill.skill_id);

        const weight =
            Number(projectSkill.weight) || 0;


        const [assessments] = await pool.execute(
            `
            SELECT
                score,
                communication_score
            FROM assessments
            WHERE freelancer_id = ?
              AND skill_id = ?
              AND status = 'COMPLETED'
              AND score IS NOT NULL
            ORDER BY completed_at DESC
            LIMIT 1
            `,
            [
                freelancerId,
                skillId
            ]
        );

        /*
         * Missing assessment = 0.
         */

        if (assessments.length === 0) {
            continue;
        }

        const assessment = assessments[0];

        const score =
            Number(assessment.score);

        if (Number.isFinite(score)) {

            /*
             * Assessment score is stored on a 0-10 scale.
             * Convert it to 0-100.
             */

            const normalizedScore =
                clamp(score * 10, 0, 100);

            weightedScore +=
                normalizedScore * weight;
        }

        const communication =
            Number(
                assessment.communication_score
            );

        if (Number.isFinite(communication)) {
            communicationTotal += communication;
            communicationCount++;
        }
    }

    return {
        dynamicTestScore: round(
            clamp(weightedScore, 0, 100)
        ),

        communicationScore: round(
            communicationCount > 0
                ? clamp(
                    communicationTotal /
                    communicationCount,
                    0,
                    100
                )
                : 0
        )
    };
};


/* =========================================================
   CALCULATE + STORE PROJECT SCORE
========================================================= */

const calculateAndStoreProjectCandidateScore = async ({
    projectId,
    freelancerId
}) => {

    projectId = Number(projectId);
    freelancerId = Number(freelancerId);

    if (
        !Number.isInteger(projectId) ||
        projectId <= 0
    ) {
        throw new Error('Invalid project ID');
    }

    if (
        !Number.isInteger(freelancerId) ||
        freelancerId <= 0
    ) {
        throw new Error('Invalid freelancer ID');
    }


    /* ---------- PROJECT ---------- */

    const [projects] = await pool.execute(
        `
        SELECT
            id,
            status,
            application_close_at,
            deadline
        FROM projects
        WHERE id = ?
        `,
        [projectId]
    );

    if (projects.length === 0) {
        throw new Error('Project not found');
    }


    /* ---------- PROJECT SKILLS ---------- */

    const [projectSkills] = await pool.execute(
        `
        SELECT
            ps.skill_id,
            ps.weight
        FROM project_skills ps
        WHERE ps.project_id = ?
        ORDER BY ps.skill_id
        `,
        [projectId]
    );


    /* ---------- FREELANCER ---------- */

    const freelancer =
        await getFreelancerData(
            freelancerId
        );


    /* ---------- ASSESSMENTS ---------- */

    const assessment =
        await calculateProjectAssessmentScore({
            projectId,
            freelancerId,
            projectSkills
        });


    /* ---------- EXPERIENCE ---------- */

    const experienceScore =
        calculateExperienceScore(
            freelancer.yearsExperience
        );


    /* ---------- PROJECT SCORE ---------- */

    const projectScore =
        calculateProjectScore({
            portfolioProjects:
                freelancer.portfolioProjects,

            freelancerSkillIds:
                freelancer.freelancerSkillIds,

            projectSkills
        });


    /* ---------- OTHERS ---------- */

    const othersCompositeScore =
        calculateOthersCompositeScore({

            educationScore:
                freelancer.educationScore,

            certificationsCount:
                freelancer.certificationsCount,

            githubActivityScore:
                freelancer.githubActivityScore,

            communicationScore:
                assessment.communicationScore,

            internshipMonths:
                freelancer.internshipMonths,

            hackathonWins:
                freelancer.hackathonWins,

            openSourceContributions:
                freelancer.openSourceContributions
        });


    /* ---------- DETERMINISTIC SCORE ---------- */

    const candidateQualityScore =
        calculateCandidateQualityScore({

            yearsExperience:
                freelancer.yearsExperience,

            dynamicTestScore:
                assessment.dynamicTestScore,

            projectScore,

            experienceScore,

            othersCompositeScore
        });


    /* ---------- ROLE TYPE ---------- */

    const roleType =
        freelancer.yearsExperience >=
        SENIOR_YEARS_THRESHOLD
            ? 'Senior'
            : 'Junior/Fresher';


    /* =====================================================
       EXACT FEATURES EXPECTED BY XGBOOST
    ===================================================== */

    const modelInput = {

        candidate_id:
            String(freelancerId),

        role_type:
            roleType,

        years_experience:
            freelancer.yearsExperience,

        project_score:
            projectScore,

        certifications_count:
            freelancer.certificationsCount,

        certifications_capped:
            freelancer.certificationsCapped,

        education_level:
            freelancer.educationLevel,

        education_score:
            freelancer.educationScore,

        dynamic_test_score:
            assessment.dynamicTestScore,

        github_activity_score:
            freelancer.githubActivityScore,

        communication_score:
            assessment.communicationScore,

        internship_months:
            freelancer.internshipMonths,

        hackathon_wins:
            freelancer.hackathonWins,

        open_source_contributions:
            freelancer.openSourceContributions,

        others_composite_score:
            othersCompositeScore
    };


    /* =====================================================
       CALL FASTAPI ML SERVICE
    ===================================================== */

    const mlResponse =
        await fetch(
            `${ML_SERVICE_URL}/predict`,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify(
                    modelInput
                )
            }
        );


    if (!mlResponse.ok) {

        const errorText =
            await mlResponse.text();

        throw new Error(
            `ML service prediction failed: ${errorText}`
        );
    }


    const mlResult =
        await mlResponse.json();


    const modelScore =
        Number(mlResult.model_score);


    if (!Number.isFinite(modelScore)) {
        throw new Error(
            'ML service returned an invalid model score'
        );
    }


    /* =====================================================
       STORE PROJECT-SPECIFIC SCORE
    ===================================================== */

    await pool.execute(
        `
        INSERT INTO project_candidate_scores
        (
            project_id,
            freelancer_id,

            project_score,
            education_score,
            dynamic_test_score,
            github_activity_score,
            communication_score,
            experience_score,
            others_composite_score,

            candidate_quality_score,
            model_score,

            model_version,
            calculated_at
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
        )

        ON DUPLICATE KEY UPDATE

            project_score =
                VALUES(project_score),

            education_score =
                VALUES(education_score),

            dynamic_test_score =
                VALUES(dynamic_test_score),

            github_activity_score =
                VALUES(github_activity_score),

            communication_score =
                VALUES(communication_score),

            experience_score =
                VALUES(experience_score),

            others_composite_score =
                VALUES(others_composite_score),

            candidate_quality_score =
                VALUES(candidate_quality_score),

            model_score =
                VALUES(model_score),

            model_version =
                VALUES(model_version),

            calculated_at =
                NOW()
        `,
        [
            projectId,
            freelancerId,

            projectScore,
            freelancer.educationScore,
            assessment.dynamicTestScore,
            freelancer.githubActivityScore,
            assessment.communicationScore,
            experienceScore,
            othersCompositeScore,

            candidateQualityScore,
            modelScore,

            MODEL_VERSION
        ]
    );


    return {
        project_id: projectId,
        freelancer_id: freelancerId,

        project_score: projectScore,
        education_score:
            freelancer.educationScore,

        dynamic_test_score:
            assessment.dynamicTestScore,

        github_activity_score:
            freelancer.githubActivityScore,

        communication_score:
            assessment.communicationScore,

        experience_score:
            experienceScore,

        others_composite_score:
            othersCompositeScore,

        candidate_quality_score:
            candidateQualityScore,

        model_score:
            round(modelScore, 4),

        model_version:
            MODEL_VERSION
    };
};


module.exports = {
    calculateAndStoreProjectCandidateScore
};