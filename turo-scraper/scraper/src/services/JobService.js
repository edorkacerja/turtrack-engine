const axios = require('axios');

// const db = require("../config/db");

class JobService {
    constructor() {
        this.jobApiBaseUrl = process.env.TURTRACK_MANAGER_API_BASE_URL +"/api/v1/jobs" || 'http://localhost:9999/api/v1/jobs';
    }

    // async getJobStatus(jobId) {
    //     const result = await db.query('SELECT status FROM job WHERE id = $1', [BigInt(jobId)]);
    //     return result.rows[0]?.status;
    // }

    async getJobStatus(jobId) {
        try {
            return "RUNNING";
            const response = await axios.get(`${this.jobApiBaseUrl}/${jobId}/status`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching job status for ${jobId}:`, error);
            throw error;
        }
    }

    async isJobRunning(jobId) {
        try {
            const status = await this.getJobStatus(jobId);
            return status === 'RUNNING';
        } catch (error) {
            console.error(`Error checking job status for ${jobId}:`, error);
            return false; // Assume job is not running if there's an error
        }
    }

    async getJobFromApi(jobId) {
        try {
            const response = await axios.get(`${this.jobApiBaseUrl}/${jobId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching job from API for ${jobId}:`, error);
            throw error;
        }
    }

    async incrementJobTotalItems(jobId, increment = 3) {
        try {
            const response = await axios.post(`${this.jobApiBaseUrl}/${jobId}/incrementTotalItems`, null, {
                params: { increment }
            });
            console.log(`Incremented total items for job ${jobId}`);
            return response.data;
        } catch (error) {
            console.error(`Error incrementing total items for job ${jobId}:`, error);
            throw error;
        }
    }
}

module.exports = new JobService();