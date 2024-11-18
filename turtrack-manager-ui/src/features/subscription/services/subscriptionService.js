// src/services/subscriptionService.js
import api from "@/common/api/axios.js";

export const subscriptionService = {


    fetchClientSecret: async (email, priceId) => {
        try {
            const response = await api.post('/api/v1/payment/create-checkout-session', {
                // customerId: user.id,
                email: email,
                priceId: priceId
            });

            return response.data;
        } catch (error) {
            throw new Error(error?.response?.data?.message || 'Failed to access subscription management');
        }
    },

    /**
     * Fetches the Stripe customer portal URL
     * @returns {Promise<{url: string}>} The URL to redirect to
     */
    getCustomerPortalUrl: async () => {
        try {
            const response = await api.post('/api/v1/checkout/customer-portal');
            return response.data;
        } catch (error) {
            throw new Error(error?.response?.data?.message || 'Failed to access subscription management');
        }
    },

    /**
     * Gets the current subscription status
     * @returns {Promise<Object>} The subscription details
     */
    getCurrentSubscription: async () => {
        try {
            const response = await api.get('/api/v1/subscriptions/current');
            return response.data;
        } catch (error) {
            throw new Error(error?.response?.data?.message || 'Failed to fetch subscription details');
        }
    },

    /**
     * Handles successful subscription
     * @param {string} sessionId - The Stripe checkout session ID
     * @returns {Promise<Object>} The subscription details
     */
    handleSubscriptionSuccess: async (sessionId) => {
        try {
            const response = await api.post('/api/v1/subscriptions/success', { sessionId });
            return response.data;
        } catch (error) {
            throw new Error(error?.response?.data?.message || 'Failed to process subscription');
        }
    }
};