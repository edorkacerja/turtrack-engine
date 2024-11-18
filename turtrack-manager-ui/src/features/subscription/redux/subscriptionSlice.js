import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../../common/api/axios.js";

// Async thunk to fetch subscription details
export const fetchSubscription = createAsyncThunk(
    'subscription/fetchSubscription',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/api/v1/subscriptions/current');
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error ||
                error.message ||
                'Failed to fetch subscription details'
            );
        }
    }
);

// Unified async thunk to update subscription
export const updateSubscription = createAsyncThunk(
    'subscription/updateSubscription',
    async (updateData, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/api/v1/subscriptions/update', updateData);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error ||
                error.message ||
                'Failed to update subscription'
            );
        }
    }
);

// Initial state with more detailed subscription information
const initialState = {
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    subscription: {
        id: null,
        status: 'none', // 'active' | 'none' | 'cancelled' | 'expired' | 'trialing'
        currentPeriodEnd: null,
        currentPeriodStart: null,
        billingCycle: 'month', // 'week' | 'month' | 'year'
        nextPaymentAmount: null,
        nextPaymentDate: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        priceId: null
    }
};

const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        resetSubscriptionError: (state) => {
            state.error = null;
        }
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
                state.subscription = {
                    ...state.subscription,
                    ...action.payload
                };
            })
            .addCase(fetchSubscription.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Update Subscription
            .addCase(updateSubscription.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateSubscription.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.subscription = {
                    ...state.subscription,
                    ...action.payload
                };
            })
            .addCase(updateSubscription.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

// Actions
export const { resetSubscriptionError } = subscriptionSlice.actions;

// Selectors
export const selectSubscriptionStatus = (state) => state.subscription.status;
export const selectSubscriptionError = (state) => state.subscription.error;
export const selectSubscription = (state) => state.subscription.subscription;
export const selectIsSubscriptionActive = (state) =>
    state.subscription.subscription.status === 'active' ||
    state.subscription.subscription.status === 'trialing';
export const selectIsCancelled = (state) =>
    state.subscription.subscription.cancelAtPeriodEnd;
export const selectBillingCycle = (state) =>
    state.subscription.subscription.billingCycle;

export default subscriptionSlice.reducer;