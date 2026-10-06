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

    return profiles.length ? profiles[0].id : null;
};


// ============================================================
// ADD HACKATHON
// ============================================================

const addHackathon = async (req, res) => {
    try {

        const {
            hackathon_name,
            position,
            won,
            event_date,
            description
        } = req.body;


        if (!hackathon_name || !hackathon_name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Hackathon name is required'
            });
        }


        if (!event_date) {
            return res.status(400).json({
                success: false,
                message: 'Event date is required'
            });
        }


        const eventDate = new Date(event_date);


        if (Number.isNaN(eventDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event date'
            });
        }


        if (won !== undefined && typeof won !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Won must be a boolean'
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
            `INSERT INTO freelancer_hackathons
             (
                freelancer_id,
                hackathon_name,
                position,
                won,
                event_date,
                description
             )
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                freelancerId,
                hackathon_name.trim(),
                position ?? null,
                won ?? false,
                event_date,
                description ?? null
            ]
        );


        const [hackathons] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                hackathon_name,
                position,
                won,
                event_date,
                description,
                created_at
             FROM freelancer_hackathons
             WHERE id = ? AND freelancer_id = ?`,
            [result.insertId, freelancerId]
        );


        // Recalculate candidate score
        await recalculateCandidateScores(freelancerId);


        return res.status(201).json({
            success: true,
            message: 'Hackathon added successfully',
            hackathon: hackathons[0]
        });

    } catch (error) {

        console.error('Add hackathon error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// GET ALL HACKATHONS
// ============================================================

const getHackathons = async (req, res) => {
    try {

        const freelancerId = await getFreelancerId(req.user.id);


        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }


        const [hackathons] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                hackathon_name,
                position,
                won,
                event_date,
                description,
                created_at
             FROM freelancer_hackathons
             WHERE freelancer_id = ?
             ORDER BY event_date DESC`,
            [freelancerId]
        );


        return res.json({
            success: true,
            hackathons
        });

    } catch (error) {

        console.error('Get hackathons error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// GET HACKATHON BY ID
// ============================================================

const getHackathonById = async (req, res) => {
    try {

        const hackathonId = Number(req.params.id);


        if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hackathon ID'
            });
        }


        const freelancerId = await getFreelancerId(req.user.id);


        if (!freelancerId) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer profile not found'
            });
        }


        const [hackathons] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                hackathon_name,
                position,
                won,
                event_date,
                description,
                created_at
             FROM freelancer_hackathons
             WHERE id = ? AND freelancer_id = ?`,
            [hackathonId, freelancerId]
        );


        if (hackathons.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hackathon not found'
            });
        }


        return res.json({
            success: true,
            hackathon: hackathons[0]
        });

    } catch (error) {

        console.error('Get hackathon by ID error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// UPDATE HACKATHON
// ============================================================

const updateHackathon = async (req, res) => {
    try {

        const hackathonId = Number(req.params.id);


        if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hackathon ID'
            });
        }


        const {
            hackathon_name,
            position,
            won,
            event_date,
            description
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
             FROM freelancer_hackathons
             WHERE id = ? AND freelancer_id = ?`,
            [hackathonId, freelancerId]
        );


        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hackathon not found'
            });
        }


        const current = existing[0];


        const newName =
            hackathon_name !== undefined
                ? hackathon_name.trim()
                : current.hackathon_name;


        const newPosition =
            position !== undefined
                ? position
                : current.position;


        const newWon =
            won !== undefined
                ? won
                : current.won;


        const newEventDate =
            event_date !== undefined
                ? event_date
                : current.event_date;


        const newDescription =
            description !== undefined
                ? description
                : current.description;


        if (!newName) {
            return res.status(400).json({
                success: false,
                message: 'Hackathon name cannot be empty'
            });
        }


        if (
            typeof newWon !== 'boolean' &&
            newWon !== 0 &&
            newWon !== 1
        ) {
            return res.status(400).json({
                success: false,
                message: 'Won must be a boolean'
            });
        }


        const parsedDate = new Date(newEventDate);


        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event date'
            });
        }


        await pool.execute(
            `UPDATE freelancer_hackathons
             SET
                hackathon_name = ?,
                position = ?,
                won = ?,
                event_date = ?,
                description = ?
             WHERE id = ? AND freelancer_id = ?`,
            [
                newName,
                newPosition,
                newWon,
                newEventDate,
                newDescription,
                hackathonId,
                freelancerId
            ]
        );


        const [updatedHackathon] = await pool.execute(
            `SELECT
                id,
                freelancer_id,
                hackathon_name,
                position,
                won,
                event_date,
                description,
                created_at
             FROM freelancer_hackathons
             WHERE id = ? AND freelancer_id = ?`,
            [hackathonId, freelancerId]
        );


        // Recalculate candidate score
        await recalculateCandidateScores(freelancerId);


        return res.json({
            success: true,
            message: 'Hackathon updated successfully',
            hackathon: updatedHackathon[0]
        });

    } catch (error) {

        console.error('Update hackathon error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// ============================================================
// DELETE HACKATHON
// ============================================================

const deleteHackathon = async (req, res) => {
    try {

        const hackathonId = Number(req.params.id);


        if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hackathon ID'
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
            `DELETE FROM freelancer_hackathons
             WHERE id = ? AND freelancer_id = ?`,
            [hackathonId, freelancerId]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hackathon not found'
            });
        }


        // Recalculate candidate score
        await recalculateCandidateScores(freelancerId);


        return res.json({
            success: true,
            message: 'Hackathon deleted successfully'
        });

    } catch (error) {

        console.error('Delete hackathon error:', error);

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
    addHackathon,
    getHackathons,
    getHackathonById,
    updateHackathon,
    deleteHackathon
};