// src/routes/AppRoutes.jsx
import { Route, Routes, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import JobsDashboard from '../features/jobs/pages/JobsDashboard/JobsDashboard';
import LandingPage from "../features/landing/pages/LandingPage.jsx";
import OAuth2Callback from "../features/auth/components/AuthModal/OAuth2Callback.jsx";
import { selectIsAuthenticated } from "../features/auth/redux/authSlice.jsx";
import { selectSubscriptionStatus } from "../features/subscription/redux/subscriptionSlice.js";
import SubscriptionGate from "../features/subscription/components/SubscriptionGate.jsx";
import PricingPage from "../features/subscription/pages/PricingPage.jsx";
import SubscriptionSuccessPage from "../features/subscription/pages/SubscriptionSuccessPage.jsx";
import RenewSubscriptionPage from "../features/subscription/pages/RenewSubscriptionPage.jsx";
import ManageSubscriptionPage from "../features/subscription/pages/ManageSubscriptionPage.jsx"; // Import the new page

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const PublicRoute = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

const AppRoutes = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const subscriptionStatus = useSelector(selectSubscriptionStatus);

    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/"
                element={
                    <PublicRoute>
                        <LandingPage />
                    </PublicRoute>
                }
            />
            {/*<Route*/}
            {/*    path="/login"*/}
            {/*    element={*/}
            {/*        <PublicRoute>*/}
            {/*            /!* Replace with your actual Login component if different *!/*/}
            {/*            <LoginPage />*/}
            {/*        </PublicRoute>*/}
            {/*    }*/}
            {/*/>*/}
            <Route
                path="/oauth2/callback"
                element={<OAuth2Callback />}
            />

            {/* Subscription Routes */}
            <Route
                path="/pricing"
                element={<PricingPage />}
            />
            <Route
                path="/subscription/success"
                element={<SubscriptionSuccessPage />}
            />
            <Route
                path="/subscription/renew"
                element={<RenewSubscriptionPage />}
            />

            {/* Manage Subscription Route */}
            <Route
                path="/subscription"
                element={
                    <ProtectedRoute>
                        <SubscriptionGate>
                            <ManageSubscriptionPage />
                        </SubscriptionGate>
                    </ProtectedRoute>
                }
            />

            {/* Protected Routes with SubscriptionGate */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <SubscriptionGate>
                            <JobsDashboard />
                        </SubscriptionGate>
                    </ProtectedRoute>
                }
            />
            {/* Add more protected routes here as needed */}

            {/* Catch All Route */}
            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
};

export default AppRoutes;
