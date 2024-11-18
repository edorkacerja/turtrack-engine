import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Alert,
    CircularProgress,
    Button,
    ButtonGroup
} from '@mui/material';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from "@/features/auth/redux/authSlice.jsx";
import api from "@/common/api/axios.js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import stripePromise from "@/features/subscription/config/stripe.js";

const PricingPage = () => {
    const user = useSelector(selectCurrentUser);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [checkoutData, setCheckoutData] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIntervals, setSelectedIntervals] = useState({});

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        // Set default selected intervals for each product
        if (products.length > 0) {
            const initialIntervals = products.reduce((acc, product) => {
                acc[product.id] = product.interval || product.availablePrices[0]?.interval;
                return acc;
            }, {});
            setSelectedIntervals(initialIntervals);
        }
    }, [products]);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/api/v1/payment/prices');
            setProducts(response.data);
        } catch (err) {
            setError('Failed to load pricing information');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPlan = async (priceId) => {
        setIsProcessing(true);
        setError(null);

        try {
            const response = await api.post('/api/v1/payment/create-checkout-session', {
                email: user.email,
                priceId: priceId
            });

            setCheckoutData({
                clientSecret: response.data.clientSecret,
                connectedAccountId: response.data.connectedAccountId
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create checkout session');
            setCheckoutData(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const getPriceForInterval = (product, interval) => {
        return product.availablePrices.find(price => price.interval === interval);
    };

    const formatPrice = (amount, currency, interval) => {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);

        return `${formattedAmount}/${interval}`;
    };

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (isLoading) {
        return (
            <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            {checkoutData?.clientSecret ? (
                <Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setCheckoutData(null)}
                        sx={{ mb: 2 }}
                    >
                        Back to Plans
                    </Button>
                    <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={{ clientSecret: checkoutData.clientSecret }}
                    >
                        <Box sx={{ width: '100%', minHeight: '500px' }}>
                            <EmbeddedCheckout />
                        </Box>
                    </EmbeddedCheckoutProvider>
                </Box>
            ) : (
                <Grid container spacing={4} justifyContent="center">
                    {products.map((product) => {
                        const selectedInterval = selectedIntervals[product.id];
                        const selectedPrice = getPriceForInterval(product, selectedInterval);
                        const uniqueIntervals = [...new Set(product.availablePrices.map(price => price.interval))];

                        return (
                            <Grid item xs={12} md={4} key={product.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        '&:hover': {
                                            boxShadow: 6
                                        }
                                    }}
                                >
                                    <CardHeader
                                        title={
                                            <Box>
                                                {product.name}
                                                <Typography variant="h5" color="primary.main" sx={{ mt: 1 }}>
                                                    {selectedPrice && formatPrice(selectedPrice.amount, selectedPrice.currency, selectedPrice.interval)}
                                                </Typography>
                                            </Box>
                                        }
                                        subheader={product.description}
                                        titleTypographyProps={{ align: 'center' }}
                                        subheaderTypographyProps={{ align: 'center' }}
                                        sx={{ pb: 0 }}
                                    />
                                    <CardContent sx={{ pt: 0, flexGrow: 1 }}>
                                        {uniqueIntervals.length > 1 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                                <ButtonGroup variant="outlined" size="small">
                                                    {uniqueIntervals.map((interval) => (
                                                        <Button
                                                            key={interval}
                                                            onClick={() => setSelectedIntervals({
                                                                ...selectedIntervals,
                                                                [product.id]: interval
                                                            })}
                                                            variant={selectedInterval === interval ? 'contained' : 'outlined'}
                                                        >
                                                            {interval}
                                                        </Button>
                                                    ))}
                                                </ButtonGroup>
                                            </Box>
                                        )}
                                        <Box sx={{ my: 3 }}>
                                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                                {product.features.map((feature, idx) => (
                                                    <li key={idx} style={{ margin: '8px 0' }}>
                                                        <Typography component="span" variant="body1">
                                                            ✓ {feature}
                                                        </Typography>
                                                    </li>
                                                ))}
                                            </ul>
                                        </Box>
                                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleSelectPlan(selectedPrice.id)}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <CircularProgress size={20} sx={{ mr: 1 }} />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    'Select Plan'
                                                )}
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Container>
    );
};

export default PricingPage;