import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme/theme';
import Page from './pages/demo/page';
import Home from './pages/Home/Home';
import GeneradorFormularios from './pages/GeneradorFormularios/GeneradorFormularios';
import DemoStepper from './pages/DemoStepper/DemoStepper';
import Login from './pages/Login/Login';
import Layout from '../components/Layout';
import RecepcionMercancia from './pages/RecepcionMercancia/RecepcionMercancia';
import Catalogos from './pages/catalogos/page';
import CatAreas from './pages/cat_Areas/page';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/' element={<Layout><Home /></Layout>} />
          <Route path='/demo' element={<Layout><Page /></Layout>} />
          <Route path='/demoStepper' element={<Layout><DemoStepper /></Layout>} />
          <Route path='/generadorFormularios' element={<Layout><GeneradorFormularios /></Layout>} />
          <Route path='/recepcion' element={<Layout><RecepcionMercancia /></Layout>} />
          <Route path='/catalogos' element={<Layout><Catalogos /></Layout>} />
          <Route path='/cat_Areas' element={<Layout><CatAreas/></Layout>} />
          
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
