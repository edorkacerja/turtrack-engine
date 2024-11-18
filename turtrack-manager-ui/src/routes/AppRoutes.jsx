import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
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
import ManageSubscriptionPage from "../features/subscription/pages/ManageSubscriptionPage.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import TurTrackDashboard from "../features/jobs/pages/TurtrackDashboard/TurTrackDashboard.jsx";

// Enhanced ProtectedRoute to save attempted URL
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
        // Save the attempted URL for redirect after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

// PublicRoute remains the same - it's already good
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
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/oauth2/callback" element={<OAuth2Callback />} />

            {/* Subscription Routes */}
            <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute>
                <SubscriptionGate>
                    <TurTrackDashboard />
                </SubscriptionGate>
            </ProtectedRoute>} />
            <Route
                path="/subscription/success"
                element={<ProtectedRoute><SubscriptionSuccessPage /></ProtectedRoute>}
            />
            <Route
                path="/subscription/renew"
                element={<ProtectedRoute><RenewSubscriptionPage /></ProtectedRoute>}
            />

            {/* Manage Subscription Route */}
            <Route
                path="/subscription"
                element={
                    <ProtectedRoute>
                        {/*<SubscriptionGate>*/}
                            <ManageSubscriptionPage />
                        {/*</SubscriptionGate>*/}
                    </ProtectedRoute>
                }
            />
            <Route
                path="/pricing"
                element={
                    <ProtectedRoute>
                        {/*<SubscriptionGate>*/}
                            <PricingPage />
                        {/*</SubscriptionGate>*/}
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

            {/* Catch All Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;