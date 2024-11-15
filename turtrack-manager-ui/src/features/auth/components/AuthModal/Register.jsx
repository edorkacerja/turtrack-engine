// src/common/components/AuthModal/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {setCredentials} from "../../redux/authSlice.jsx";
import {API_BASE_URL} from "../../../../common/util/constants.js";


const Register = ({ onClose }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // First, get the CSRF token
            const csrfResponse = await fetch(`http://localhost:9999/csrf`, {
                method: 'GET',
                credentials: 'include',
            });
            const csrfToken = csrfResponse.headers.get('X-XSRF-TOKEN');

            // Then make the registration request
            const response = await fetch(`http://localhost:9999/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Registration failed');
            }

            const data = await response.json();

            dispatch(setCredentials({
                user: {
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    subscriptionStatus: data.subscriptionStatus
                },
                token: data.token
            }));

            onClose();
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'An error occurred during registration');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="form">
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="form-group">
                <label className="form-label">
                    First Name
                </label>
                <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your first name"
                />
            </div>

            <div className="form-group">
                <label className="form-label">
                    Last Name
                </label>
                <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your last name"
                />
            </div>

            <div className="form-group">
                <label className="form-label">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your email"
                />
            </div>

            <div className="form-group">
                <label className="form-label">
                    Password
                </label>
                <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Choose a password"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="form-submit"
            >
                {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
        </form>
    );
};

export default Register;