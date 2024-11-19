import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser } from "@/features/auth/redux/authSlice";
import { Alert } from "@/components/ui/alert";
import PricingCard from "@/features/subscription/components/PricingCard";
import {
    fetchProducts,
    fetchCurrentPrice,
    selectProducts,
    selectProductsStatus,
    selectProductsError,
    selectCurrentPrice,
    selectCurrentPriceStatus,
    selectCurrentPriceError,  // Added this selector
} from "../redux/subscriptionSlice";
import api from "@/common/api/axios";

const PricingPage = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectCurrentUser);
    const products = useSelector(selectProducts);
    const productsStatus = useSelector(selectProductsStatus);
    const productsError = useSelector(selectProductsError);
    const currentPrice = useSelector(selectCurrentPrice);
    const currentPriceStatus = useSelector(selectCurrentPriceStatus);
    const currentPriceError = useSelector(selectCurrentPriceError);  // Added this line
    const isProcessing = productsStatus === 'loading' || currentPriceStatus === 'loading';
    const error = productsError || currentPriceError;

    useEffect(() => {
        dispatch(fetchProducts());
        if (user) {
            dispatch(fetchCurrentPrice());
        }
    }, [dispatch, user]);

    const handleSubscribe = async (selectedPriceId) => {
        try {
            const response = await api.post("/api/v1/payment/create-portal-session", {
                email: user.email,
                returnUrl: window.location.origin + '/subscription'
            });

            if (response.data?.url) {
                window.location.href = response.data.url;
            } else {
                throw new Error('No portal URL received');
            }
        } catch (err) {
            console.error('Failed to access subscription portal:', err);
        }
    };

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <Alert variant="destructive">{error}</Alert>
            </div>
        );
    }

    if (isProcessing) {
        return (
            <div className="container mx-auto py-8 flex justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
                    <p className="text-lg text-gray-600">Get started with our flexible pricing options</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {products.map((product) => {
                        const prices = product.availablePrices || [];
                        const features = product.features || [
                            "Basic features",
                            "Customer support",
                            "Regular updates"
                        ];

                        return prices.map((price) => {
                            const isPopular = price.metadata?.popular === "true";
                            const isCurrentPlan = currentPrice?.id === price.id;

                            return (
                                <PricingCard
                                    key={price.id}
                                    title={`${product.name} ${price.nickname || ''}`}
                                    price={price.amount}
                                    interval={price.interval || "month"}
                                    features={features}
                                    isPopular={isPopular}
                                    isCurrentPlan={isCurrentPlan}
                                    isTestMode={product.isTestMode}
                                    onSubscribe={handleSubscribe}
                                    isProcessing={isProcessing}
                                    priceId={price.id}
                                />
                            );
                        });
                    })}
                </div>
            </div>
        </div>
    );
};

export default PricingPage;