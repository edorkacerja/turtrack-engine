import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/authSlice.jsx';

const OAuth2Callback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            // Get the auth response from header
            const authResponse = JSON.parse(decodeURIComponent(
                document.querySelector('meta[name="x-auth-response"]')?.content || '{}'
            ));

            dispatch(setCredentials({
                user: {
                    email: authResponse.email,
                    firstName: authResponse.firstName,
                    lastName: authResponse.lastName,
                    subscriptionStatus: authResponse.subscriptionStatus
                },
                token
            }));

            navigate('/dashboard');
        } else {
            navigate('/');
        }
    }, [dispatch, navigate]);

    return <div>Processing login...</div>;
};

export default OAuth2Callback;