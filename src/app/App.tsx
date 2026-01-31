import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme/theme';
import Page from './pages/demo/page';
import POS from '../pages/POS';
import Home from './pages/Home/Home';
import GeneradorFormularios from './pages/GeneradorFormularios/GeneradorFormularios';
import DemoStepper from './pages/DemoStepper/DemoStepper';
import Login from './pages/Login/Login';
import Layout from '../components/Layout';
import RecepcionMercancia from './pages/RecepcionMercancia/RecepcionMercancia';
import Catalogos from './pages/catalogos/page';
import CatAreas from './pages/cat_Areas/page';
import CatTipoDescuentos from './pages/cat_Tipo_Descuento/page';
import CatCompradores from './pages/cat_Compradores/page';
import CatMarcas from './pages/cat_Marcas/page';
import CatSucursales from './pages/cat_Sucursales/page';
import CatProveedor from './pages/cat_Proveedores/page';
import CatCliente from './pages/cat_Clientes/page';
import CatClientesForm from './pages/cat_Clientes/page2';
import AsignacionHorarios from './pages/AsignacionHorarios/AsignacionHorarios';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />} />

          <Route path="/pos" element={<Layout><POS /></Layout>} />

          <Route path='/' element={<Layout><Home /></Layout>} />
          <Route path='/demo' element={<Layout><Page /></Layout>} />
          <Route path='/demoStepper' element={<Layout><DemoStepper /></Layout>} />
          <Route path='/generadorFormularios' element={<Layout><GeneradorFormularios /></Layout>} />
          <Route path='/recepcion' element={<Layout><RecepcionMercancia /></Layout>} />
          <Route path='/catalogos' element={<Layout><Catalogos /></Layout>} />
          <Route path='/cat_Areas' element={<Layout><CatAreas/></Layout>} />
         <Route path='/cat_Tipo_Descuento' element={<Layout><CatTipoDescuentos/></Layout>} />
         <Route path='/cat_Compradores' element={<Layout><CatCompradores/></Layout>} />
          <Route path='/cat_Marcas' element={<Layout><CatMarcas/></Layout>} />
          <Route path='/cat_Sucursales' element={<Layout><CatSucursales/></Layout>} />
         <Route path='/cat_Proveedores' element={<Layout><CatProveedor/></Layout>} />
         <Route path='/cat_Clientes' element={<Layout><CatCliente/></Layout>} />
         <Route path='/cat_Clientes_form' element={<Layout><CatClientesForm/></Layout>} />
         <Route path='/asignacion-horarios' element={<Layout><AsignacionHorarios/></Layout>} />
         

          <Route
            path='/pos'
            element={
              <Layout>
                <POS />
              </Layout>
            }
          />


          <Route
            path='/'
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route
            path='/demo'
            element={
              <Layout>
                <Page />
              </Layout>
            }
          />
          <Route
            path='/demoStepper'
            element={
              <Layout>
                <DemoStepper />
              </Layout>
            }
          />
          <Route
            path='/generadorFormularios'
            element={
              <Layout>
                <GeneradorFormularios />
              </Layout>
            }
          />
          <Route
            path='/recepcion'
            element={
              <Layout>
                <RecepcionMercancia />
              </Layout>
            }
          />
          <Route
            path='/catalogos'
            element={
              <Layout>
                <Catalogos />
              </Layout>
            }
          />
          <Route
            path='/cat_Areas'
            element={
              <Layout>
                <CatAreas />
              </Layout>
            }
          />
          <Route
            path='/cat_Tipo_Descuento'
            element={
              <Layout>
                <CatTipoDescuentos />
              </Layout>
            }
          />
          <Route
            path='/cat_Compradores'
            element={
              <Layout>
                <CatCompradores />
              </Layout>
            }
          />
          <Route
            path='/cat_Marcas'
            element={
              <Layout>
                <CatMarcas />
              </Layout>
            }
          />
          <Route
            path='/cat_Sucursales'
            element={
              <Layout>
                <CatSucursales />
              </Layout>
            }
          />
          <Route
            path='/cat_Proveedores'
            element={
              <Layout>
                <CatProveedor />
              </Layout>
            }
          />
          <Route
            path='/cat_Clientes'
            element={
              <Layout>
                <CatCliente />
              </Layout>
            }
          />

          <Route
            path='/'
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route
            path='/demo'
            element={
              <Layout>
                <Page />
              </Layout>
            }
          />
          <Route
            path='/demoStepper'
            element={
              <Layout>
                <DemoStepper />
              </Layout>
            }
          />
          <Route
            path='/generadorFormularios'
            element={
              <Layout>
                <GeneradorFormularios />
              </Layout>
            }
          />
          <Route
            path='/recepcion'
            element={
              <Layout>
                <RecepcionMercancia />
              </Layout>
            }
          />
          <Route
            path='/catalogos'
            element={
              <Layout>
                <Catalogos />
              </Layout>
            }
          />
          <Route
            path='/cat_Areas'
            element={
              <Layout>
                <CatAreas />
              </Layout>
            }
          />
          <Route
            path='/cat_Marcas'
            element={
              <Layout>
                <CatMarcas />
              </Layout>
            }
          />
          <Route
            path='/cat_Sucursales'
            element={
              <Layout>
                <CatSucursales />
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
