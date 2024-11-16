// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import logger from 'redux-logger';
import jobsReducer from '../features/jobs/redux/jobsSlice';
import authReducer from '../features/auth/redux/authSlice';
import subscriptionReducer from '../features/subscription/redux/subscriptionSlice.js';

const rootReducer = {
    jobs: jobsReducer,
    auth: authReducer,
    subscription: subscriptionReducer,
    // Add other reducers here as your application grows
};

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        import.meta.env.MODE !== 'production'
            ? getDefaultMiddleware().concat(logger)
            : getDefaultMiddleware(),
});

// Custom hook for dispatching actions
export const useAppDispatch = () => useDispatch();

// src/store/hooks.js
import { useSelector } from 'react-redux';

// Custom hook for selecting state
export const useAppSelector = useSelector;