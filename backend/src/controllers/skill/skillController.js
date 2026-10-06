const pool = require('../../config/db');

const getSkills = async (req, res) => {
    try {
        const [skills] = await pool.query(
            `SELECT id, name
             FROM skills
             WHERE is_active = TRUE
             ORDER BY name ASC`
        );

        return res.status(200).json({
            success: true,
            skills
        });
    } catch (error) {
        console.error('Get skills error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch skills'
        });
    }
};

module.exports = {
    getSkills
};
