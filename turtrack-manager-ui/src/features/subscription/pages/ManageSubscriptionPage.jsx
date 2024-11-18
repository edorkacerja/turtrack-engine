// src/pages/ManageSubscriptionPage.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Alert,
    Stack
} from '@mui/material';
import { selectCurrentUser } from "@/features/auth/redux/authSlice.jsx";
import {subscriptionService} from "@/features/subscription/services/subscriptionService.js";

const ManageSubscriptionPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const user = useSelector(selectCurrentUser);

    useEffect(() => {
        fetchSubscriptionDetails();
    }, []);

    const fetchSubscriptionDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const subscriptionData = await subscriptionService.getCurrentSubscription();
            setSubscription(subscriptionData);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const { url } = await subscriptionService.getCustomerPortalUrl();
            window.location.href = url;
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!window.confirm('Are you sure you want to cancel your subscription?')) {
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            await subscriptionService.cancelSubscription();
            await fetchSubscriptionDetails(); // Refresh subscription status
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" className="manage-subscription">
            <Stack spacing={4}>
                <Typography variant="h4" component="h1">
                    Manage Subscription
                </Typography>

                {subscription && (
                    <Card variant="outlined">
                        <CardContent>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Current Plan
                                    </Typography>
                                    <Typography variant="body1">
                                        {subscription.planName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Status: {subscription.status}
                                    </Typography>
                                    {subscription.renewalDate && (
                                        <Typography variant="body2" color="text.secondary">
                                            Next billing date: {new Date(subscription.renewalDate).toLocaleDateString()}
                                        </Typography>
                                    )}
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                <Card variant="outlined">
                    <CardContent>
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Manage your TurTrack subscription through our secure customer portal
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    You'll be redirected to Stripe's secure portal where you can:
                                </Typography>
                                <ul style={{ color: 'text.secondary', marginLeft: '20px' }}>
                                    <li>View your subscription details</li>
                                    <li>Update your payment method</li>
                                    <li>Change your billing cycle</li>
                                    <li>View payment history</li>
                                    <li>Download invoices</li>
                                </ul>
                            </Box>

                            <Stack spacing={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleManageSubscription}
                                    disabled={isLoading}
                                    fullWidth
                                >
                                    Manage Subscription
                                </Button>

                                {subscription?.status === 'active' && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={handleCancelSubscription}
                                        disabled={isLoading}
                                        fullWidth
                                    >
                                        Cancel Subscription
                                    </Button>
                                )}
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
};

export default ManageSubscriptionPage;