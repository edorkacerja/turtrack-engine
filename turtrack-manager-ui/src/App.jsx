import { BrowserRouter } from 'react-router-dom'
import './App.css'
import AppRoutes from './routes/AppRoutes.jsx'
import NavBar from "./common/components/NavBar.jsx";

function App() {

    return (
        <BrowserRouter>
            <NavBar />
            <AppRoutes />
        </BrowserRouter>
    )
}

export default App