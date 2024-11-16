// src/features/auth/redux/authSlice.jsx
import { createSlice } from '@reduxjs/toolkit';

const loadInitialState = () => {
    try {
        const userData = localStorage.getItem('user');
        return {
            user: userData ? JSON.parse(userData) : null,
            isAuthenticated: !!userData // If we have user data, we're authenticated
        };
    } catch (error) {
        return {
            user: null,
            isAuthenticated: false
        };
    }
};

const authSlice = createSlice({
    name: 'auth',
    initialState: loadInitialState(),
    reducers: {
        setCredentials: (state, { payload }) => {
            state.user = payload.user;
            state.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(payload.user));
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('user');
        }
    }
});

export const { setCredentials, logout } = authSlice.actions;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export default authSlice.reducer;