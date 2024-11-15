import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { API_BASE_URL } from "../../../../common/util/constants.js";
import {setCredentials} from "../../redux/authSlice.jsx";

const OAuth2Callback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // The session is already established, just fetch the current user data
                const response = await fetch(`http://localhost:9999/auth/me`, {
                    credentials: 'include', // Important for sending the session cookie
                });

                if (!response.ok) {
                    throw new Error('Failed to get user data');
                }

                const userData = await response.json();

                dispatch(setCredentials({
                    user: {
                        email: userData.email,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        subscriptionStatus: userData.subscriptionStatus
                    }
                }));

                // Redirect to dashboard after successful login
                navigate('/dashboard');
            } catch (error) {
                console.error('Authentication error:', error);
                navigate('/login'); // Redirect to login on error
            }
        };

        fetchUserData();
    }, [dispatch, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Completing login...</h2>
                <p>Please wait while we finish setting up your session.</p>
            </div>
        </div>
    );
};

export default OAuth2Callback;