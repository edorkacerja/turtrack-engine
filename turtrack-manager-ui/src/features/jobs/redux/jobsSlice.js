import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = import.meta.env.VITE_TURTRACK_MANAGER_SERVER_BASE_URL || 'http://localhost:9999/api/v1';

const initialState = {
    jobs: [],
    status: 'idle',
    error: null,
    currentPage: 0,
    itemsPerPage: 10,
    totalPages: 1,
    totalElements: 0,
};

export const fetchJobs = createAsyncThunk('jobs/fetchJobs', async (_, { getState }) => {
    const state = getState();
    const { currentPage, itemsPerPage } = state.jobs;
    const response = await fetch(`${API_BASE_URL}/jobs?page=${currentPage}&size=${itemsPerPage}`);
    if (!response.ok) {
        throw new Error('Failed to fetch jobs');
    }
    const data = await response.json();
    return data;
});

export const updateJobStatus = createAsyncThunk(
    'jobs/updateJobStatus',
    async ({ jobId, status }) => {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/${status === 'STOPPED' ? 'stop' : 'start'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            throw new Error('Failed to update job status');
        }
        const data = await response.json();
        return data;
    }
);

const jobsSlice = createSlice({
    name: 'jobs',
    initialState,
    reducers: {
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload;
        },
        updateJobProgress: (state, action) => {
            const job = state.jobs.find(job => job.id === action.payload.id);
            if (job) {
                job.processedItems = action.payload.processedItems;
                job.failedItems = action.payload.failedItems;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchJobs.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchJobs.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.jobs = action.payload.content;
                state.totalPages = action.payload.totalPages;
                state.totalElements = action.payload.totalElements;
                state.currentPage = action.payload.number;
                state.itemsPerPage = action.payload.size;
            })
            .addCase(fetchJobs.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Failed to fetch jobs';
            })
            .addCase(updateJobStatus.fulfilled, (state, action) => {
                const index = state.jobs.findIndex(job => job.id === action.payload.id);
                if (index !== -1) {
                    state.jobs[index] = action.payload;
                }
            });
    },
});

export const { setCurrentPage, updateJobProgress } = jobsSlice.actions;

export default jobsSlice.reducer;