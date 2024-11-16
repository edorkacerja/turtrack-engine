import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/authSlice';
import api from "../../../../common/api/axios.js";

const OAuth2Callback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // The session is already established via cookies
                const { data: userData } = await api.get('/auth/me');

                dispatch(setCredentials({
                    user: {
                        email: userData.email,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        profilePicture: userData.profilePicture,
                        subscriptionStatus: userData.subscriptionStatus,
                    },
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