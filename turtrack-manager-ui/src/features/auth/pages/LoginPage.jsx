// src/features/auth/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, selectAuthError, selectIsAuthenticated } from '../redux/authSlice';
import { useNavigate, Navigate } from 'react-router-dom';
import './LoginPage.scss'; // Create this file for styling

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const authError = useSelector(selectAuthError);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [isLoading, setIsLoading] = useState(false);

    const { email, password } = formData;

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await dispatch(login({ email, password })).unwrap();
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to login:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="login-page">
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={handleChange}
                        required
                        placeholder="Enter your password"
                    />
                </div>
                {authError && <div className="error-message">{authError}</div>}
                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <div className="additional-options">
                <p>Or login with:</p>
                <button onClick={() => navigate('/oauth2/callback')} className="oauth-button">
                    OAuth2 Login
                </button>
            </div>
        </div>
    );
};

export default LoginPage;
