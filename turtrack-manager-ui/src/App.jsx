import { BrowserRouter } from 'react-router-dom'
import './App.scss'
import AppRoutes from './routes/AppRoutes.jsx'
import NavBar from "./common/layouts/NavBar/NavBar.jsx";

function App() {

    return (
        <BrowserRouter>
            <NavBar />
            <AppRoutes />
        </BrowserRouter>
    )
}

export default App