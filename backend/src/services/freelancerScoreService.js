const pool = require('../config/db');


const MODEL_VERSION = 'candidate-quality-v1';

const MIN_PROJECT_SCORE = 27.6;
const MAX_PROJECT_SCORE = 98.4;

const MIN_OTHERS_SCORE = 22.5;
const MAX_OTHERS_SCORE = 92.0;

const SENIOR_YEARS_THRESHOLD = 3;


// --------------------------------------------------
// HELPERS
// --------------------------------------------------

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


const calculateYearsBetween = (startDate, endDate) => {
    return calculateMonthsBetween(startDate, endDate) / 12;
};


const getQualityLabel = (score) => {
    if (score >= 80) {
        return 'EXCELLENT';
    }

    if (score >= 65) {
        return 'GOOD';
    }

    if (score >= 50) {
        return 'AVERAGE';
    }

    return 'POOR';
};


// --------------------------------------------------
// EXPERIENCE SCORE
// --------------------------------------------------

const calculateExperienceScore = (yearsExperience) => {
    const years = clamp(
        Number(yearsExperience) || 0,
        0,
        12
    );

    return round((years / 12) * 100);
};


// --------------------------------------------------
// EDUCATION SCORE
// --------------------------------------------------

const calculateEducationScore = (educationRecords) => {
    if (!educationRecords || educationRecords.length === 0) {
        return 0;
    }

    const scores = educationRecords
        .map(record => Number(record.education_score))
        .filter(score => Number.isFinite(score));

    if (scores.length === 0) {
        return 0;
    }

    return round(Math.max(...scores));
};


// --------------------------------------------------
// GITHUB ACTIVITY SCORE
// --------------------------------------------------

const calculateGithubActivityScore = (profile) => {
    /*
     * GitHub has intentionally low influence in the
     * finalized scoring design.
     *
     * At this stage we only have the freelancer's
     * GitHub URL in freelancer_profiles.
     *
     * Actual repository/activity analysis can be
     * integrated later without changing the rest
     * of the scoring pipeline.
     */

    if (
        profile &&
        profile.github_url &&
        profile.github_url.trim()
    ) {
        return 100;
    }

    return 0;
};


// --------------------------------------------------
// PROJECT SCORE
// --------------------------------------------------

const calculateProjectScore = (
    portfolioProjects,
    freelancerSkillIds
) => {
    if (!portfolioProjects || portfolioProjects.length === 0) {
        return MIN_PROJECT_SCORE;
    }

    const numProjects = portfolioProjects.length;

    const numNorm =
        Math.min(numProjects / 10, 1.0) * 100;

    let complexityTotal = 0;
    let deploymentTotal = 0;
    let starsTotal = 0;
    let technologyRelevanceTotal = 0;

    const freelancerSkills = new Set(
        (freelancerSkillIds || []).map(id => Number(id))
    );

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

        /*
         * Project-specific skill relevance is intentionally
         * not stored in candidate_scores.
         *
         * For the general freelancer score, technology
         * relevance is estimated from the freelancer's
         * structured skill coverage.
         *
         * If the project contains no canonical skill IDs,
         * use a neutral value rather than inventing a
         * project-specific match.
         */
        if (
            project.skill_ids &&
            project.skill_ids.length > 0
        ) {
            const projectSkills = project.skill_ids
                .map(id => Number(id))
                .filter(id => Number.isInteger(id));

            if (projectSkills.length > 0) {
                const matchedSkills =
                    projectSkills.filter(id =>
                        freelancerSkills.has(id)
                    ).length;

                technologyRelevanceTotal +=
                    (matchedSkills / projectSkills.length) * 100;
            } else {
                technologyRelevanceTotal += 0;
            }
        } else {
            technologyRelevanceTotal += 0;
        }
    }

    const projectCount = portfolioProjects.length;

    const compNorm =
        complexityTotal / projectCount;

    const deploymentNorm =
        deploymentTotal / projectCount;

    const starsNorm =
        starsTotal / projectCount;

    const techRelevance =
        technologyRelevanceTotal / projectCount;

    let projectScore =
        0.20 * numNorm +
        0.25 * compNorm +
        0.20 * techRelevance +
        0.20 * deploymentNorm +
        0.15 * starsNorm;

    projectScore = clamp(
        projectScore,
        MIN_PROJECT_SCORE,
        MAX_PROJECT_SCORE
    );

    return round(projectScore);
};


// --------------------------------------------------
// OTHERS COMPOSITE SCORE
// --------------------------------------------------

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
        (Math.min(
            Number(certificationsCount) || 0,
            7
        ) / 7) * 100;

    const internshipScore =
        (clamp(
            Number(internshipMonths) || 0,
            0,
            6
        ) / 6) * 100;

    const hackathonScore =
        (Math.min(
            Number(hackathonWins) || 0,
            4
        ) / 4) * 100;

    const ossScore =
        (Math.min(
            Number(openSourceContributions) || 0,
            20
        ) / 20) * 100;

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


// --------------------------------------------------
// CANDIDATE QUALITY SCORE
// --------------------------------------------------

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


// --------------------------------------------------
// MAIN RECALCULATION FUNCTION
// --------------------------------------------------

const recalculateCandidateScores = async (freelancerId) => {
    if (
        !Number.isInteger(Number(freelancerId)) ||
        Number(freelancerId) <= 0
    ) {
        throw new Error('Invalid freelancer ID');
    }

    freelancerId = Number(freelancerId);

    // ----------------------------------------------
    // PROFILE
    // ----------------------------------------------

    const [profiles] = await pool.execute(
        `SELECT
            id,
            user_id,
            bio,
            years_experience,
            github_url
         FROM freelancer_profiles
         WHERE id = ?`,
        [freelancerId]
    );

    if (profiles.length === 0) {
        throw new Error('Freelancer profile not found');
    }

    const profile = profiles[0];


    // ----------------------------------------------
    // EDUCATION
    // ----------------------------------------------

    const [education] = await pool.execute(
        `SELECT
            fe.id,
            fe.education_level_id,
            el.education_score
         FROM freelancer_education fe
         INNER JOIN education_levels el
            ON el.id = fe.education_level_id
         WHERE fe.freelancer_id = ?`,
        [freelancerId]
    );

    const educationScore =
        calculateEducationScore(education);


    // ----------------------------------------------
    // FREELANCER SKILLS
    // ----------------------------------------------

    const [skills] = await pool.execute(
        `SELECT skill_id
         FROM freelancer_skills
         WHERE freelancer_id = ?`,
        [freelancerId]
    );

    const freelancerSkillIds =
        skills.map(skill => skill.skill_id);


    // ----------------------------------------------
    // PORTFOLIO PROJECTS
    // ----------------------------------------------

    const [portfolioProjects] = await pool.execute(
        `SELECT
            id,
            complexity,
            has_deployment,
            github_stars
         FROM portfolio_projects
         WHERE freelancer_id = ?`,
        [freelancerId]
    );


    /*
     * Project skill IDs are optional here.
     *
     * portfolio_projects currently stores the
     * technology information as project data rather
     * than a project-skill junction table.
     *
     * Therefore the general project score uses the
     * available portfolio quality signals.
     */
    const projectScore =
        calculateProjectScore(
            portfolioProjects,
            freelancerSkillIds
        );


    // ----------------------------------------------
    // CERTIFICATIONS
    // ----------------------------------------------

    const [certificates] = await pool.execute(
        `SELECT COUNT(*) AS verified_count
         FROM freelancer_certificates
         WHERE freelancer_id = ?
         AND verification_status = 'VERIFIED'`,
        [freelancerId]
    );

    const certificationsCount =
        Number(certificates[0]?.verified_count || 0);


    // ----------------------------------------------
    // INTERNSHIPS
    // ----------------------------------------------

    const [internships] = await pool.execute(
        `SELECT
            start_date,
            end_date
         FROM freelancer_internships
         WHERE freelancer_id = ?`,
        [freelancerId]
    );

    let internshipMonths = 0;

    for (const internship of internships) {
        internshipMonths += calculateMonthsBetween(
            internship.start_date,
            internship.end_date
        );
    }

    internshipMonths = round(
        clamp(internshipMonths, 0, 6)
    );


    // ----------------------------------------------
    // HACKATHONS
    // ----------------------------------------------

    const [hackathons] = await pool.execute(
        `SELECT COUNT(*) AS win_count
         FROM freelancer_hackathons
         WHERE freelancer_id = ?
         AND won = 1`,
        [freelancerId]
    );

    const hackathonWins =
        Math.min(
            Number(hackathons[0]?.win_count || 0),
            4
        );


    // ----------------------------------------------
    // OPEN SOURCE
    // ----------------------------------------------

    const [openSource] = await pool.execute(
        `SELECT
            COALESCE(
                SUM(contributions_count),
                0
            ) AS total_contributions
         FROM freelancer_open_source
         WHERE freelancer_id = ?`,
        [freelancerId]
    );

    const openSourceContributions =
        Math.min(
            Number(
                openSource[0]?.total_contributions || 0
            ),
            20
        );


    // ----------------------------------------------
    // ASSESSMENTS
    // ----------------------------------------------

    const [assessmentResults] = await pool.execute(
        `SELECT
            score,
            communication_score
         FROM assessments
         WHERE freelancer_id = ?
         AND status = 'COMPLETED'
         AND score IS NOT NULL`,
        [freelancerId]
    );

    let dynamicTestScore = 0;
    let communicationScore = 0;

    if (assessmentResults.length > 0) {
        const validScores = assessmentResults
            .map(row => Number(row.score))
            .filter(score => Number.isFinite(score));

        if (validScores.length > 0) {
    dynamicTestScore =
        (
            validScores.reduce(
                (sum, score) => sum + score,
                0
            ) / validScores.length
        ) * 10;
}

        const validCommunicationScores =
            assessmentResults
                .map(row => Number(row.communication_score))
                .filter(score => Number.isFinite(score));

        if (validCommunicationScores.length > 0) {
            communicationScore =
                validCommunicationScores.reduce(
                    (sum, score) => sum + score,
                    0
                ) / validCommunicationScores.length;
        }
    }

    dynamicTestScore = round(
        clamp(dynamicTestScore, 0, 100)
    );

    communicationScore = round(
        clamp(communicationScore, 0, 100)
    );


    // ----------------------------------------------
    // EXPERIENCE
    // ----------------------------------------------

    const [experienceRecords] = await pool.execute(
        `SELECT
            start_date,
            end_date,
            is_current
         FROM freelancer_experience
         WHERE freelancer_id = ?`,
        [freelancerId]
    );

    let yearsExperience = 0;

    const now = new Date();

    for (const experience of experienceRecords) {
        const endDate =
            experience.is_current
                ? now
                : experience.end_date;

        yearsExperience += calculateYearsBetween(
            experience.start_date,
            endDate
        );
    }

    yearsExperience = round(
        clamp(yearsExperience, 0, 12)
    );

    const experienceScore =
        calculateExperienceScore(yearsExperience);


    // ----------------------------------------------
    // GITHUB
    // ----------------------------------------------

    const githubActivityScore =
        calculateGithubActivityScore(profile);


    // ----------------------------------------------
    // OTHERS COMPOSITE
    // ----------------------------------------------

    const othersCompositeScore =
        calculateOthersCompositeScore({
            educationScore,
            certificationsCount,
            githubActivityScore,
            communicationScore,
            internshipMonths,
            hackathonWins,
            openSourceContributions
        });


    // ----------------------------------------------
    // CANDIDATE QUALITY
    // ----------------------------------------------

    const candidateQualityScore =
        calculateCandidateQualityScore({
            yearsExperience,
            dynamicTestScore,
            projectScore,
            experienceScore,
            othersCompositeScore
        });

    const qualityLabel =
        getQualityLabel(candidateQualityScore);


    // ----------------------------------------------
    // UPSERT CANDIDATE SCORE
    // ----------------------------------------------

    await pool.execute(
        `INSERT INTO candidate_scores
        (
            freelancer_id,
            project_score,
            education_score,
            dynamic_test_score,
            github_activity_score,
            communication_score,
            experience_score,
            others_composite_score,
            candidate_quality_score,
            quality_label,
            model_version,
            calculated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            project_score = VALUES(project_score),
            education_score = VALUES(education_score),
            dynamic_test_score = VALUES(dynamic_test_score),
            github_activity_score = VALUES(github_activity_score),
            communication_score = VALUES(communication_score),
            experience_score = VALUES(experience_score),
            others_composite_score = VALUES(others_composite_score),
            candidate_quality_score = VALUES(candidate_quality_score),
            quality_label = VALUES(quality_label),
            model_version = VALUES(model_version),
            calculated_at = NOW()`,
        [
            freelancerId,
            projectScore,
            educationScore,
            dynamicTestScore,
            githubActivityScore,
            communicationScore,
            experienceScore,
            othersCompositeScore,
            candidateQualityScore,
            qualityLabel,
            MODEL_VERSION
        ]
    );


    return {
        freelancer_id: freelancerId,
        project_score: projectScore,
        education_score: educationScore,
        dynamic_test_score: dynamicTestScore,
        github_activity_score: githubActivityScore,
        communication_score: communicationScore,
        experience_score: experienceScore,
        others_composite_score: othersCompositeScore,
        candidate_quality_score: candidateQualityScore,
        quality_label: qualityLabel,
        model_version: MODEL_VERSION
    };
};


module.exports = {
    recalculateCandidateScores
};