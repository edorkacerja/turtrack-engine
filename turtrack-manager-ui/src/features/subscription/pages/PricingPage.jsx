import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/auth/redux/authSlice.jsx";
import api from "@/common/api/axios.js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import stripePromise from "@/features/subscription/config/stripe.js";
import { Alert } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import PricingCard from "@/features/subscription/components/PricingCard.jsx";

const PricingPage = () => {
    const user = useSelector(selectCurrentUser);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [checkoutData, setCheckoutData] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get("/api/v1/payment/prices");
            setProducts(response.data);
        } catch (err) {
            setError("Failed to load pricing information");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async (priceId) => {
        setIsProcessing(true);
        setError(null);

        try {
            const response = await api.post("/api/v1/payment/create-checkout-session", {
                email: user.email,
                priceId: priceId,
            });

            setCheckoutData({
                clientSecret: response.data.clientSecret,
                connectedAccountId: response.data.connectedAccountId,
            });
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create checkout session");
            setCheckoutData(null);
        } finally {
            setIsProcessing(false);
        }
    };

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <Alert variant="destructive">{error}</Alert>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 flex justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 min-h-screen py-8">
            <div className="container mx-auto px-4">
                {checkoutData?.clientSecret ? (
                    <div className="max-w-2xl mx-auto mb-8">
                        <Button
                            variant="outline"
                            onClick={() => setCheckoutData(null)}
                            className="mb-4"
                        >
                            Back to Plans
                        </Button>
                        <EmbeddedCheckoutProvider
                            stripe={stripePromise}
                            options={{ clientSecret: checkoutData.clientSecret }}
                        >
                            <div className="bg-white shadow-md rounded-lg p-4">
                                <EmbeddedCheckout />
                            </div>
                        </EmbeddedCheckoutProvider>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {products.map((product) => {
                            const selectedInterval = product.interval || "week";
                            const price = product.availablePrices[0]?.amount || "0";

                            return (
                                <PricingCard
                                    key={product.id}
                                    title={product.name}
                                    price={price}
                                    interval={selectedInterval}
                                    isTestMode={product.isTestMode || false}
                                    onSubscribe={() => handleSubscribe(product.availablePrices[0]?.id)}
                                    isProcessing={isProcessing}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PricingPage;
