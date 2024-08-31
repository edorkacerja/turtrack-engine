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
    sortBy: 'startedAt',
    sortDirection: 'desc',
};

export const fetchJobs = createAsyncThunk('jobs/fetchJobs', async (_, { getState }) => {
    const { currentPage, itemsPerPage, sortBy, sortDirection } = getState().jobs;
    const response = await fetch(`${API_BASE_URL}/jobs?page=${currentPage}&size=${itemsPerPage}&sort=${sortBy},${sortDirection}`);
    if (!response.ok) {
        throw new Error('Failed to fetch jobs');
    }
    return await response.json();
});

export const updateJobStatus = createAsyncThunk('jobs/updateJobStatus', async ({ jobId, status }) => {
    const action = status === 'STOPPED' ? 'stop' : 'start';
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error('Failed to update job status');
    }
    return await response.json();
});

const jobsSlice = createSlice({
    name: 'jobs',
    initialState,
    reducers: {
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload;
        },
        setItemsPerPage: (state, action) => {
            state.itemsPerPage = action.payload;
        },
        setSorting: (state, action) => {
            state.sortBy = action.payload.sortBy;
            state.sortDirection = action.payload.sortDirection;
        },
        updateJobProgress: (state, action) => {
            const index = state.jobs.findIndex(job => job.id === action.payload.id);
            if (index !== -1) {
                state.jobs[index].processedItems = action.payload.processedItems;
                state.jobs[index].failedItems = action.payload.failedItems;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchJobs.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchJobs.fulfilled, (state, action) => {
                state.jobs = action.payload.content;
                state.totalPages = action.payload.totalPages;
                state.totalElements = action.payload.totalElements;
                state.currentPage = action.payload.number;
                state.itemsPerPage = action.payload.size;
                state.status = 'succeeded';
            })
            .addCase(fetchJobs.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(updateJobStatus.fulfilled, (state, action) => {
                const index = state.jobs.findIndex(job => job.id === action.payload.id);
                if (index !== -1) {
                    state.jobs[index].status = action.payload.status;
                }
            });
    },
});

export const { setCurrentPage, setItemsPerPage, setSorting, updateJobProgress } = jobsSlice.actions;

export default jobsSlice.reducer;
