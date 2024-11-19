import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../../common/api/axios.js";

// Async thunk to fetch products and prices
export const fetchProducts = createAsyncThunk(
    'subscription/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/api/v1/payment/prices');
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error ||
                error.message ||
                'Failed to fetch products'
            );
        }
    }
);

// Async thunk to fetch current price
export const fetchCurrentPrice = createAsyncThunk(
    'subscription/fetchCurrentPrice',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/api/v1/payment/current-price');
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error ||
                error.message ||
                'Failed to fetch current price'
            );
        }
    }
);

// Previous thunks remain unchanged
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

const initialState = {
    status: 'idle',
    error: null,
    subscription: {
        id: null,
        status: 'none',
        currentPeriodEnd: null,
        currentPeriodStart: null,
        billingCycle: 'month',
        nextPaymentAmount: null,
        nextPaymentDate: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        priceId: null
    },
    products: [],
    currentPrice: null,
    productsStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    currentPriceStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    productsError: null,
    currentPriceError: null
};

const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        resetSubscriptionError: (state) => {
            state.error = null;
            state.productsError = null;
            state.currentPriceError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Products
            .addCase(fetchProducts.pending, (state) => {
                state.productsStatus = 'loading';
                state.productsError = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.productsStatus = 'succeeded';
                state.products = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.productsStatus = 'failed';
                state.productsError = action.payload;
            })
            // Fetch Current Price
            .addCase(fetchCurrentPrice.pending, (state) => {
                state.currentPriceStatus = 'loading';
                state.currentPriceError = null;
            })
            .addCase(fetchCurrentPrice.fulfilled, (state, action) => {
                state.currentPriceStatus = 'succeeded';
                state.currentPrice = action.payload;
            })
            .addCase(fetchCurrentPrice.rejected, (state, action) => {
                state.currentPriceStatus = 'failed';
                state.currentPriceError = action.payload;
            })
            // Existing subscription cases
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

// Existing selectors
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

// New selectors
export const selectProducts = (state) => state.subscription.products;
export const selectProductsStatus = (state) => state.subscription.productsStatus;
export const selectProductsError = (state) => state.subscription.productsError;
export const selectCurrentPrice = (state) => state.subscription.currentPrice;
export const selectCurrentPriceStatus = (state) => state.subscription.currentPriceStatus;
export const selectCurrentPriceError = (state) => state.subscription.currentPriceError;

export default subscriptionSlice.reducer;