// App.jsx
import { BrowserRouter } from 'react-router-dom'
import './App.scss'
// import './index.scss'
import AppRoutes from './routes/AppRoutes.jsx'
import NavBar from "./common/layouts/NavBar/NavBar.jsx";
import {fetchCurrentPrice, fetchProducts, fetchSubscription} from "./features/subscription/redux/subscriptionSlice.js";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectIsAuthenticated } from './features/auth/redux/authSlice';

function App() {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);

    useEffect(() => {
        // Only fetch subscription if user is authenticated
        if (isAuthenticated) {
            dispatch(fetchSubscription());
            dispatch(fetchCurrentPrice());
            dispatch(fetchProducts());
        }
    }, [dispatch, isAuthenticated]);


    return (
        <BrowserRouter>
            <NavBar />
            <AppRoutes />
        </BrowserRouter>
    )
}

export default App;