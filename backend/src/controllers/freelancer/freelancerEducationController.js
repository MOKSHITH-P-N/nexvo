const pool = require('../../config/db');

const {
    recalculateCandidateScores
} = require('../../services/freelancerScoreService');


// ============================================================
// ADD EDUCATION
// ============================================================

const addEducation = async (req, res) => {
    try {

        const {
            education_level_id,
            institution,
            field_of_study,
            start_year,
            end_year
        } = req.body;


        // ----------------------------------------------------
        // Validate education level
        // ----------------------------------------------------

        if (
            education_level_id === undefined ||
            !Number.isInteger(Number(education_level_id)) ||
            Number(education_level_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Valid education_level_id is required'
            });
        }


        // ----------------------------------------------------
        // Validate start year
        // ----------------------------------------------------

        if (
            start_year !== undefined &&
            start_year !== null &&
            (
                !Number.isInteger(Number(start_year)) ||
                Number(start_year) < 1900
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid start_year'
            });
        }


        // ----------------------------------------------------
        // Validate end year
        // ----------------------------------------------------

        if (
            end_year !== undefined &&
            end_year !== null &&
            (
                !Number.isInteger(Number(end_year)) ||
                Number(end_year) < 1900
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid end_year'
            });
        }


        // ----------------------------------------------------
        // Validate year order
        // ----------------------------------------------------

        if (
            start_year !== undefined &&
            start_year !== null &&
            end_year !== undefined &&
            end_year !== null &&
            Number(end_year) < Number(start_year)
        ) {
            return res.status(400).json({
                success: false,
                message: 'end_year cannot be earlier than start_year'
            });
        }


        // ----------------------------------------------------
        // Get freelancer profile
        // ----------------------------------------------------

        const [profiles] = await pool.execute(
            `SELECT id
             FROM freelancer_profiles
             WHERE user_id = ?`,
            [req.user.id]
        );


        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }


        const freelancerId = profiles[0].id;


        // ----------------------------------------------------
        // Validate education level exists
        // ----------------------------------------------------

        const [educationLevels] = await pool.execute(
            `SELECT id, name, education_score
             FROM education_levels
             WHERE id = ?`,
            [Number(education_level_id)]
        );


        if (educationLevels.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid education level'
            });
        }


        // ----------------------------------------------------
        // Insert education
        // ----------------------------------------------------

        const [result] = await pool.execute(
            `INSERT INTO freelancer_education (
                freelancer_id,
                education_level_id,
                institution,
                field_of_study,
                start_year,
                end_year
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                freelancerId,
                Number(education_level_id),
                institution ?? null,
                field_of_study ?? null,
                start_year ?? null,
                end_year ?? null
            ]
        );


        // ----------------------------------------------------
        // Recalculate candidate score
        // ----------------------------------------------------

        await recalculateCandidateScores(freelancerId);


        return res.status(201).json({
            success: true,
            message: 'Education added successfully',
            education: {
                id: result.insertId,
                freelancer_id: freelancerId,
                education_level_id: Number(education_level_id),
                education_level: educationLevels[0].name,
                institution: institution ?? null,
                field_of_study: field_of_study ?? null,
                start_year: start_year ?? null,
                end_year: end_year ?? null
            }
        });

    } catch (error) {

        console.error('Add freelancer education error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// GET ALL EDUCATION
// ============================================================

const getEducation = async (req, res) => {
    try {

        const [education] = await pool.execute(
            `SELECT
                fe.id,
                fe.education_level_id,
                el.name AS education_level,
                el.education_score,
                fe.institution,
                fe.field_of_study,
                fe.start_year,
                fe.end_year,
                fe.created_at
             FROM freelancer_education fe
             INNER JOIN freelancer_profiles fp
                 ON fp.id = fe.freelancer_id
             INNER JOIN education_levels el
                 ON el.id = fe.education_level_id
             WHERE fp.user_id = ?
             ORDER BY fe.start_year DESC`,
            [req.user.id]
        );


        return res.json({
            success: true,
            education
        });

    } catch (error) {

        console.error('Get freelancer education error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// GET EDUCATION BY ID
// ============================================================

const getEducationById = async (req, res) => {
    try {

        const educationId = Number(req.params.id);


        if (!Number.isInteger(educationId) || educationId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid education ID'
            });
        }


        const [education] = await pool.execute(
            `SELECT
                fe.id,
                fe.education_level_id,
                el.name AS education_level,
                el.education_score,
                fe.institution,
                fe.field_of_study,
                fe.start_year,
                fe.end_year,
                fe.created_at
             FROM freelancer_education fe
             INNER JOIN freelancer_profiles fp
                 ON fp.id = fe.freelancer_id
             INNER JOIN education_levels el
                 ON el.id = fe.education_level_id
             WHERE fe.id = ?
             AND fp.user_id = ?`,
            [educationId, req.user.id]
        );


        if (education.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Education record not found'
            });
        }


        return res.json({
            success: true,
            education: education[0]
        });

    } catch (error) {

        console.error('Get education by ID error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// UPDATE EDUCATION
// ============================================================

const updateEducation = async (req, res) => {
    try {

        const educationId = Number(req.params.id);


        if (!Number.isInteger(educationId) || educationId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid education ID'
            });
        }


        const {
            education_level_id,
            institution,
            field_of_study,
            start_year,
            end_year
        } = req.body;


        // ----------------------------------------------------
        // Validate education level
        // ----------------------------------------------------

        if (
            education_level_id !== undefined &&
            (
                !Number.isInteger(Number(education_level_id)) ||
                Number(education_level_id) <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid education_level_id'
            });
        }


        // ----------------------------------------------------
        // Validate start year
        // ----------------------------------------------------

        if (
            start_year !== undefined &&
            start_year !== null &&
            (
                !Number.isInteger(Number(start_year)) ||
                Number(start_year) < 1900
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid start_year'
            });
        }


        // ----------------------------------------------------
        // Validate end year
        // ----------------------------------------------------

        if (
            end_year !== undefined &&
            end_year !== null &&
            (
                !Number.isInteger(Number(end_year)) ||
                Number(end_year) < 1900
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid end_year'
            });
        }


        // ----------------------------------------------------
        // Get existing education
        // ----------------------------------------------------

        const [existing] = await pool.execute(
            `SELECT
                fe.id,
                fe.freelancer_id,
                fe.education_level_id,
                fe.institution,
                fe.field_of_study,
                fe.start_year,
                fe.end_year
             FROM freelancer_education fe
             INNER JOIN freelancer_profiles fp
                 ON fp.id = fe.freelancer_id
             WHERE fe.id = ?
             AND fp.user_id = ?`,
            [educationId, req.user.id]
        );


        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Education record not found'
            });
        }


        const old = existing[0];

        const freelancerId = old.freelancer_id;


        // ----------------------------------------------------
        // Keep old values if not provided
        // ----------------------------------------------------

        const finalEducationLevelId =
            education_level_id !== undefined
                ? Number(education_level_id)
                : old.education_level_id;


        const finalInstitution =
            institution !== undefined
                ? institution
                : old.institution;


        const finalFieldOfStudy =
            field_of_study !== undefined
                ? field_of_study
                : old.field_of_study;


        const finalStartYear =
            start_year !== undefined
                ? start_year
                : old.start_year;


        const finalEndYear =
            end_year !== undefined
                ? end_year
                : old.end_year;


        // ----------------------------------------------------
        // Validate final years
        // ----------------------------------------------------

        if (
            finalStartYear !== undefined &&
            finalStartYear !== null &&
            (
                !Number.isInteger(Number(finalStartYear)) ||
                Number(finalStartYear) < 1900
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid start_year'
            });
        }


        if (
            finalEndYear !== undefined &&
            finalEndYear !== null &&
            (
                !Number.isInteger(Number(finalEndYear)) ||
                Number(finalEndYear) < 1900
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid end_year'
            });
        }


        if (
            finalStartYear !== undefined &&
            finalStartYear !== null &&
            finalEndYear !== undefined &&
            finalEndYear !== null &&
            Number(finalEndYear) < Number(finalStartYear)
        ) {
            return res.status(400).json({
                success: false,
                message: 'end_year cannot be earlier than start_year'
            });
        }


        // ----------------------------------------------------
        // Validate education level exists
        // ----------------------------------------------------

        const [levels] = await pool.execute(
            `SELECT id
             FROM education_levels
             WHERE id = ?`,
            [finalEducationLevelId]
        );


        if (levels.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid education level'
            });
        }


        // ----------------------------------------------------
        // Update education
        // ----------------------------------------------------

        await pool.execute(
            `UPDATE freelancer_education
             SET education_level_id = ?,
                 institution = ?,
                 field_of_study = ?,
                 start_year = ?,
                 end_year = ?
             WHERE id = ?`,
            [
                finalEducationLevelId,
                finalInstitution,
                finalFieldOfStudy,
                finalStartYear,
                finalEndYear,
                educationId
            ]
        );


        // ----------------------------------------------------
        // Recalculate candidate score
        // ----------------------------------------------------

        await recalculateCandidateScores(freelancerId);


        return res.json({
            success: true,
            message: 'Education updated successfully'
        });

    } catch (error) {

        console.error('Update freelancer education error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// DELETE EDUCATION
// ============================================================

const deleteEducation = async (req, res) => {
    try {

        const educationId = Number(req.params.id);


        if (!Number.isInteger(educationId) || educationId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid education ID'
            });
        }


        // ----------------------------------------------------
        // Get freelancer ID before deleting
        // ----------------------------------------------------

        const [existing] = await pool.execute(
            `SELECT fe.freelancer_id
             FROM freelancer_education fe
             INNER JOIN freelancer_profiles fp
                 ON fp.id = fe.freelancer_id
             WHERE fe.id = ?
             AND fp.user_id = ?`,
            [educationId, req.user.id]
        );


        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Education record not found'
            });
        }


        const freelancerId = existing[0].freelancer_id;


        // ----------------------------------------------------
        // Delete education
        // ----------------------------------------------------

        const [result] = await pool.execute(
            `DELETE fe
             FROM freelancer_education fe
             INNER JOIN freelancer_profiles fp
                 ON fp.id = fe.freelancer_id
             WHERE fe.id = ?
             AND fp.user_id = ?`,
            [educationId, req.user.id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Education record not found'
            });
        }


        // ----------------------------------------------------
        // Recalculate candidate score
        // ----------------------------------------------------

        await recalculateCandidateScores(freelancerId);


        return res.json({
            success: true,
            message: 'Education deleted successfully'
        });

    } catch (error) {

        console.error('Delete freelancer education error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    addEducation,
    getEducation,
    getEducationById,
    updateEducation,
    deleteEducation
};