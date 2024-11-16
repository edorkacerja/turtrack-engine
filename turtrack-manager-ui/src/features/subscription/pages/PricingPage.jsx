import { useEffect, useState } from 'react';
import { getCsrfToken } from "../../../common/api.js";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe } from '@stripe/react-stripe-js';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Alert,
    Stack
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const stripePromise = loadStripe('your_publishable_key_here');

const PricingContent = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedInterval, setSelectedInterval] = useState('month');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const stripe = useStripe();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:9999/api/v1/products', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            const formattedProducts = data.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                features: product.features || [],
                prices: product.availablePrices || [],
                defaultPrice: product.availablePrices?.[0] || null
            }));

            setProducts(formattedProducts);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
            console.error('Error fetching products:', err);
        }
    };

    const getProductPrice = (product) => {
        const price = product.prices.find(p => p.interval === selectedInterval) || product.defaultPrice;
        return price ? price.amount : '0';
    };

    const getPriceId = (product) => {
        const price = product.prices.find(p => p.interval === selectedInterval) || product.defaultPrice;
        return price ? price.id : null;
    };

    const handleSubscribe = async (priceId) => {
        try {
            if (!stripe) return;

            setSelectedProduct(priceId);
            const csrfToken = await getCsrfToken();

            const response = await fetch('http://localhost:9999/api/subscriptions/create-checkout-session', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    priceId: priceId,
                    successUrl: `${window.location.origin}/success`,
                    cancelUrl: `${window.location.origin}/pricing`,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create checkout session');
            }

            const { sessionId } = await response.json();
            const { error } = await stripe.redirectToCheckout({ sessionId });

            if (error) throw error;
        } catch (err) {
            setError(err.message);
            setSelectedProduct(null);
            console.error('Error creating subscription:', err);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ maxWidth: 'sm', mx: 'auto', mt: 4 }}>
                <Alert severity="error">Error: {error}</Alert>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Stack spacing={4} alignItems="center">
                <Typography variant="h3" component="h1" align="center" gutterBottom>
                    Choose Your Plan
                </Typography>
                <Typography variant="h6" align="center" color="text.secondary">
                    Select the plan that best fits your needs
                </Typography>

                <ToggleButtonGroup
                    value={selectedInterval}
                    exclusive
                    onChange={(e, newInterval) => newInterval && setSelectedInterval(newInterval)}
                    sx={{ mb: 4 }}
                >
                    <ToggleButton value="month">Monthly</ToggleButton>
                    <ToggleButton value="year">Yearly</ToggleButton>
                </ToggleButtonGroup>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)'
                    },
                    gap: 4,
                    width: '100%'
                }}>
                    {products.map((product) => (
                        <Card key={product.id} variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    {product.name}
                                </Typography>
                                <Typography color="text.secondary" paragraph>
                                    {product.description}
                                </Typography>
                                <Typography variant="h4" component="div" gutterBottom>
                                    ${getProductPrice(product)}
                                    <Typography component="span" variant="subtitle1" color="text.secondary">
                                        /{selectedInterval}
                                    </Typography>
                                </Typography>
                                <List dense>
                                    {product.features.map((feature, index) => (
                                        <ListItem key={index} disableGutters>
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <CheckIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText primary={feature} />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                            <CardActions sx={{ p: 2, pt: 0 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => handleSubscribe(getPriceId(product))}
                                    disabled={selectedProduct === getPriceId(product) || !getPriceId(product)}
                                >
                                    {selectedProduct === getPriceId(product)
                                        ? 'Processing...'
                                        : !getPriceId(product)
                                            ? 'Not Available'
                                            : 'Subscribe'}
                                </Button>
                            </CardActions>
                        </Card>
                    ))}
                </Box>

                {selectedInterval === 'year' && (
                    <Alert severity="success" sx={{ mt: 4 }}>
                        Save up to 20% with yearly billing
                    </Alert>
                )}
            </Stack>
        </Container>
    );
};

const PricingPage = () => {
    return (
        <Elements stripe={stripePromise}>
            <PricingContent />
        </Elements>
    );
};

export default PricingPage;