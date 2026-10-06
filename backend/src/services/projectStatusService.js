const pool = require('../config/db');

const closeExpiredProjects = async () => {
    try {
        const [result] = await pool.execute(
            `UPDATE projects
             SET status = 'CLOSED'
             WHERE status = 'OPEN'
               AND application_close_at IS NOT NULL
               AND application_close_at < NOW()`
        );

        if (result.affectedRows > 0) {
            console.log(
                `[Project Status] Closed ${result.affectedRows} expired project(s)`
            );
        }
    } catch (error) {
        console.error(
            '[Project Status] Error closing expired projects:',
            error
        );
    }
};

const startProjectStatusScheduler = () => {
    // Run once when the server starts
    closeExpiredProjects();

    // Run every 10 minutes
    setInterval(
        closeExpiredProjects,
        10 * 60 * 1000
    );

    console.log(
        '[Project Status] Scheduler started. Checking every 10 minutes.'
    );
};

module.exports = {
    closeExpiredProjects,
    startProjectStatusScheduler
};