// src/routes/AppRoutes.jsx
import { Route, Routes, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import JobsDashboard from '../features/jobs/pages/JobsDashboard/JobsDashboard';
import {selectIsAuthenticated} from "../features/auth/redux/authSlice.jsx";
import LandingPage from "../features/landing/pages/LandingPage.jsx";

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
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

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <JobsDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Catch all route */}
            <Route
                path="*"
                element={
                    isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />
        </Routes>
    );
};

export default AppRoutes;