const pool = require('../config/db');

const getActiveSkills = async () => {
    const [skills] = await pool.query(
        `SELECT id, name
         FROM skills
         WHERE is_active = TRUE
         ORDER BY name ASC`
    );

    return skills;
};

module.exports = {
    getActiveSkills
};