// src/features/subscriptions/pages/RenewSubscriptionPage.jsx
import React from 'react';
import CheckoutForm from '../components/CheckoutForm.jsx'; // Adjust the path as needed

const RenewSubscriptionPage = () => {
    return (
        <div>
            <h1>Renew Your Subscription</h1>
            <CheckoutForm priceId="price_monthly_id" /> {/* Replace with appropriate priceId */}
        </div>
    );
};

export default RenewSubscriptionPage;
