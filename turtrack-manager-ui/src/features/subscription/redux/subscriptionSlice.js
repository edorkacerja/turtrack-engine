// src/features/subscription/redux/subscriptionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from "../../../common/util/constants.js";
import {getCsrfToken} from "../../../common/api.js";

// Async thunk to fetch subscription details
export const fetchSubscription = createAsyncThunk(
    'subscription/fetchSubscription',
    async (_, { rejectWithValue }) => {
        try {
            const csrfToken = await getCsrfToken(); // Fetch CSRF token

            const response = await fetch(`${API_BASE_URL}/subscriptions`, {
                method: 'GET',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrfToken, // Include CSRF token in headers
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch subscription');
            }

            const data = await response.json();
            return data; // Assuming it returns { status: 'active' | 'none' | 'expired', ... }
        } catch (err) {
            return rejectWithValue(err.message || 'An error occurred while fetching subscription details.');
        }
    }
);

// Async thunk to update subscription
export const updateSubscription = createAsyncThunk(
    'subscription/updateSubscription',
    async ({ plan }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/subscription/update`, {
                method: 'POST',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ plan }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update subscription');
            }

            const data = await response.json();
            return data; // Assuming it returns updated subscription details
        } catch (err) {
            return rejectWithValue(err.message || 'An error occurred while updating subscription.');
        }
    }
);

const initialState = {
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    subscriptionStatus: 'none', // 'active' | 'none' | 'expired'
    error: null,
};

const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        // Add synchronous reducers if needed
    },
    extraReducers: (builder) => {
        builder
            // Fetch Subscription
            .addCase(fetchSubscription.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchSubscription.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.subscriptionStatus = action.payload.status;
                // Update other subscription details if available
            })
            .addCase(fetchSubscription.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch subscription';
            })
            // Update Subscription
            .addCase(updateSubscription.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateSubscription.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.subscriptionStatus = action.payload.status;
                // Update other subscription details if available
            })
            .addCase(updateSubscription.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to update subscription';
            });
    },
});

// Selectors
export const selectSubscriptionStatus = (state) => state.subscription.subscriptionStatus;
export const selectSubscriptionError = (state) => state.subscription.error;

// Export the reducer
export default subscriptionSlice.reducer;
