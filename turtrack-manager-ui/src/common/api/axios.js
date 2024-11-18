// src/api/axios.js
import axios from 'axios';
import {store} from "@/store/store.js";
import {logout} from "../../features/auth/redux/authSlice.jsx";

const api = axios.create({
    baseURL: 'http://localhost:9999',
    withCredentials: true
});

// Global error handling
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            store.dispatch(logout());
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data?.message || error.message);
    }
);

export default api;