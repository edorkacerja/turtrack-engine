// src/features/landing/pages/LandingPage.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const LandingPage = () => {
    // Redirect to dashboard if already authenticated
    const isAuthenticated = localStorage.getItem('token') !== null;

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to TurTrack Manager
            </h1>
            <p className="text-lg text-gray-600 mb-8">
                Please sign in to access your dashboard
            </p>
        </div>
    );
};

export default LandingPage;