import { BrowserRouter } from 'react-router-dom'
import './App.scss'
import AppRoutes from './routes/AppRoutes.jsx'
import NavBar from "./common/layouts/NavBar/NavBar.jsx";
import {fetchSubscription} from "./features/subscription/redux/subscriptionSlice.js";
import {useEffect} from "react";
import {useDispatch} from "react-redux";

function App() {
    const dispatch = useDispatch();

    // useEffect(() => {
    //     dispatch(fetchSubscription());
    // }, [dispatch]);

    return (
        <BrowserRouter>
            <NavBar />
            <AppRoutes />
        </BrowserRouter>
    )
}

export default App