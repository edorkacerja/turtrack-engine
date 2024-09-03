const db = require("../config/db");

async function getJobStatus(jobId) {
    const result = await db.query('SELECT status FROM job WHERE id = $1', [BigInt(jobId)]);
    return result.rows[0]?.status;
}


module.exports = {
    getJobStatus
}