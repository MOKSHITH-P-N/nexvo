const pool = require('../../config/db');

const {
    recalculateCandidateScores
} = require('../../services/freelancerScoreService');


// ============================================================
// GET FREELANCER ID
// ============================================================

const getFreelancerId = async (userId) => {
    const [profiles] = await pool.execute(
        `SELECT id
         FROM freelancer_profiles
         WHERE user_id = ?`,
        [userId]
    );

    if (profiles.length === 0) {
        return null;
    }

    return profiles[0].id;
};


// ============================================================
// ADD CERTIFICATE
// ============================================================

const addCertificate = async (req, res) => {
    try {

        const {
            certificate_name,
            issuing_organization,
            certificate_url,
            issued_at
        } = req.body;


        if (!certificate_name || !certificate_name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Certificate name is required'
            });
        }


        if (!issuing_organization || !issuing_organization.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Issuing organization is required'
            });
        }


        const freelancerId = await getFreelancerId(req.user.id);


        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }


        const [result] = await pool.execute(
            `INSERT INTO freelancer_certificates
             (
                freelancer_id,
                certificate_name,
                issuing_organization,
                certificate_url,
                issued_at,
                verification_status
             )
             VALUES (?, ?, ?, ?, ?, 'PENDING')`,
            [
                freelancerId,
                certificate_name.trim(),
                issuing_organization.trim(),
                certificate_url ?? null,
                issued_at ?? null
            ]
        );


        const [certificate] = await pool.execute(
            `SELECT
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
             WHERE id = ? AND freelancer_id = ?`,
            [result.insertId, freelancerId]
        );


        // Recalculate candidate score after certificate changes
        await recalculateCandidateScores(freelancerId);


        return res.status(201).json({
            success: true,
            message: 'Certificate added successfully',
            certificate: certificate[0]
        });

    } catch (error) {

        console.error('Add certificate error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// GET ALL CERTIFICATES
// ============================================================

const getCertificates = async (req, res) => {
    try {

        const freelancerId = await getFreelancerId(req.user.id);


        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }


        const [certificates] = await pool.execute(
            `SELECT
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
             WHERE freelancer_id = ?
             ORDER BY issued_at DESC, created_at DESC`,
            [freelancerId]
        );


        return res.json({
            success: true,
            certificates
        });

    } catch (error) {

        console.error('Get certificates error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// GET CERTIFICATE BY ID
// ============================================================

const getCertificateById = async (req, res) => {
    try {

        const certificateId = Number(req.params.id);


        if (!Number.isInteger(certificateId) || certificateId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid certificate ID'
            });
        }


        const freelancerId = await getFreelancerId(req.user.id);


        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }


        const [certificates] = await pool.execute(
            `SELECT
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
             WHERE id = ? AND freelancer_id = ?`,
            [certificateId, freelancerId]
        );


        if (certificates.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }


        return res.json({
            success: true,
            certificate: certificates[0]
        });

    } catch (error) {

        console.error('Get certificate by ID error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// UPDATE CERTIFICATE
// ============================================================

const updateCertificate = async (req, res) => {
    try {

        const certificateId = Number(req.params.id);


        if (!Number.isInteger(certificateId) || certificateId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid certificate ID'
            });
        }


        const {
            certificate_name,
            issuing_organization,
            certificate_url,
            issued_at
        } = req.body;


        const freelancerId = await getFreelancerId(req.user.id);


        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }


        const [existing] = await pool.execute(
            `SELECT *
             FROM freelancer_certificates
             WHERE id = ? AND freelancer_id = ?`,
            [certificateId, freelancerId]
        );


        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }


        const current = existing[0];


        const newCertificateName =
            certificate_name !== undefined
                ? certificate_name.trim()
                : current.certificate_name;


        const newOrganization =
            issuing_organization !== undefined
                ? issuing_organization.trim()
                : current.issuing_organization;


        if (!newCertificateName) {
            return res.status(400).json({
                success: false,
                message: 'Certificate name cannot be empty'
            });
        }


        if (!newOrganization) {
            return res.status(400).json({
                success: false,
                message: 'Issuing organization cannot be empty'
            });
        }


        await pool.execute(
            `UPDATE freelancer_certificates
             SET
                certificate_name = ?,
                issuing_organization = ?,
                certificate_url = ?,
                issued_at = ?
             WHERE id = ? AND freelancer_id = ?`,
            [
                newCertificateName,
                newOrganization,
                certificate_url !== undefined
                    ? certificate_url
                    : current.certificate_url,
                issued_at !== undefined
                    ? issued_at
                    : current.issued_at,
                certificateId,
                freelancerId
            ]
        );


        const [updatedCertificate] = await pool.execute(
            `SELECT
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
             WHERE id = ? AND freelancer_id = ?`,
            [certificateId, freelancerId]
        );


        // Recalculate candidate score after certificate changes
        await recalculateCandidateScores(freelancerId);


        return res.json({
            success: true,
            message: 'Certificate updated successfully',
            certificate: updatedCertificate[0]
        });

    } catch (error) {

        console.error('Update certificate error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// DELETE CERTIFICATE
// ============================================================

const deleteCertificate = async (req, res) => {
    try {

        const certificateId = Number(req.params.id);


        if (!Number.isInteger(certificateId) || certificateId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid certificate ID'
            });
        }


        const freelancerId = await getFreelancerId(req.user.id);


        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }


        const [result] = await pool.execute(
            `DELETE FROM freelancer_certificates
             WHERE id = ? AND freelancer_id = ?`,
            [certificateId, freelancerId]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }


        // Recalculate candidate score after certificate changes
        await recalculateCandidateScores(freelancerId);


        return res.json({
            success: true,
            message: 'Certificate deleted successfully'
        });

    } catch (error) {

        console.error('Delete certificate error:', error);

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
    addCertificate,
    getCertificates,
    getCertificateById,
    updateCertificate,
    deleteCertificate
};