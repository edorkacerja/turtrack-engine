import { useSelector } from 'react-redux';
import {Navigate} from "react-router-dom";
import {selectSubscriptionStatus} from "../redux/subscriptionSlice.js";
import {selectIsAuthenticated} from "../../auth/redux/authSlice.jsx";

export const SubscriptionGate = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const subscriptionStatus = useSelector(selectSubscriptionStatus);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (subscriptionStatus === 'none') {
        return <Navigate to="/subscription" />;
    }

    if (subscriptionStatus === 'expired') {
        return <Navigate to="/renew-subscription" />;
    }

    return children;
};

export default SubscriptionGate;