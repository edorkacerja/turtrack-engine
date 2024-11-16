// src/components/CheckoutForm.jsx
import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        if (!stripe || !elements) {
            setError('Stripe has not loaded yet.');
            setLoading(false);
            return;
        }

        const { error: stripeError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Optionally, you can specify a return URL
                // return_url: 'http://localhost:5173/subscription/success',
            },
            redirect: 'if_required',
        });

        if (stripeError) {
            setError(stripeError.message);
            setLoading(false);
            return;
        }

        // Payment succeeded
        // Redirect or notify user of success
        window.location.href = '/subscription/success';
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            <button type="submit" disabled={!stripe || loading}>
                {loading ? 'Processing...' : 'Subscribe'}
            </button>
            {error && <div className="error">{error}</div>}
        </form>
    );
};

export default CheckoutForm;
