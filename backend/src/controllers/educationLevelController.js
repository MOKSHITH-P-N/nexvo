const pool = require('../config/db');

const getEducationLevels = async (req, res) => {
    try {
        const [levels] = await pool.query(
            `
            SELECT
                id,
                name,
                education_score
            FROM education_levels
            ORDER BY id ASC
            `
        );

        return res.status(200).json({
            success: true,
            education_levels: levels
        });

    } catch (error) {
        console.error(
            'Error fetching education levels:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch education levels'
        });
    }
};

module.exports = {
    getEducationLevels
};