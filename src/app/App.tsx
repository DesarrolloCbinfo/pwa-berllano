import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme/theme';
import Page from './pages/demo/page';
import POS from './pages/POS';
import POS_v2 from './pages/POS_v2';
import POS_v3 from './pages/POS_v3/POS_v3';
import Home from './pages/Home/Home';
import GeneradorFormularios from './pages/GeneradorFormularios/GeneradorFormularios';
import DemoStepper from './pages/DemoStepper/DemoStepper';
import Login from './pages/Login/Login';
import Layout from '../components/Layout';
import RecepcionMercancia from './pages/RecepcionMercancia/RecepcionMercancia';
import Catalogos from './pages/catalogos/page';
import CatAreasDeptosClases from './pages/cat_AreasDeptosClases/page';
import CatTipoDescuentos from './pages/cat_Tipo_Descuento/page';
import CatCompradores from './pages/cat_Compradores/page';
import CatMarcas from './pages/cat_Marcas/page';
import CatSucursales from './pages/cat_Sucursales/page';
import CatCliente from './pages/cat_Clientes/page';
import AsignacionHorarios from './pages/AsignacionHorarios/AsignacionHorarios';
import Cat_MarcasFamilias from './pages/Cat_Marcas_Familias/page';
import CatProveedores from './pages/cat_Proveedores/page';
import AdministracionServiciosInsumos from './pages/modulo_servicios_Insumos/page';
import AdministracionPorcentajesPuntos from './pages/Modulo_De_Administracion_De_Porcentajes_De_Puntos/page';
import CatProductos from './pages/cat_Productos/page';
import ConfiguracionPromocionesDescuentoPorcentual from './pages/Promociones_descuento_porcentual/pages';
import Retiros from './pages/Retiros';
import CorteParcial from './pages/CorteParcial';
import CorteDia from './pages/CorteDia';
import AjusteMasivoPrecios from './pages/AjusteMasivoPrecios/page';
import MetasEmpleados from './pages/Cat_metaempleados/page';
import MetasSucursales from './pages/Cat_metasucursal/page';
import ConfigComisiones from './pages/Cat_configcomisiones/page';
import ConfigComisiones2 from './pages/Cat_configcomisiones2/page';
import AccesosAlternos from './pages/cat_accesosalternos/page';
import ConceptosAjustes from './pages/cat_conceptos_ajustes/page';
import TiposMovimientos from './pages/cat_tipos_movimientos/page';
import CarteleraDigital from './pages/CarteleraDigital/page';
import Facturacion from './pages/Facturacion/page';

import PlasticosAutorizados from './pages/Cat_Plasticos_Autorizados/pages';
import MediosPagos from './pages/cat_Medios_Pago/page';
import DescuentoProveedores from './pages/cat_DescProveedores/page';
import ProveedoresAcreedores from './pages/cat_proveedores_acreedores/page';
import CatTrabajadores from './pages/cat_trabajadores/page';
import CatNominaDepartamentos from './pages/cat_nomina_departamentos/page';
import CatNominaStatus from './pages/cat_nomina_Status/page';
import CatNominaFormasPagos from './pages/cat_nomina_formas_pagos/page';
import CatNominaPuestos from './pages/cat_nomina_puestos/page';
import CatNominaBajas from './pages/cat_nomina_bajas/page';
import FactoresSucursales from './pages/FactoresSucursal/page';

import NominasMovimientos from './pages/cat_nominas_movimientos/page';
import DiasFestivos from './pages/cat_dias_festivos/page';
import NivelesEstudios from './pages/cat_niveles_estudios_rrhh/page'; 
import NominasHorarios from './pages/cat_nominas_horarios/page';
import CuentasBancarias from './pages/cat_cuentas_bancarias/page';
import TiposCuentas from './pages/cat_tipos_cuentas/page';
import Usuarios from './pages/cat_usuarios/page';
import FoliosNomina from './pages/cat_nominas_folios/page';
import TurnosDobles from './pages/Cat_turnos_dobles/page';
import CatPerfilesPermisos from './pages/cat_perfiles_permisos/page';
import CatCategorias from './pages/cat_Categorias/page';
import CatPermisosDeptos from './pages/cat_PermisosDeptos/page';
import ValidacionProductosServicios from './pages/Validacion_Productos_Servicios/page';








function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />} />

          <Route path='/pos' element={<Layout><POS /></Layout>} />
          <Route path='/pos2' element={<Layout><POS_v2 /></Layout>} />
          <Route path='/pos3' element={<Layout><POS_v3 /></Layout>} />

          <Route path='/' element={<Layout><Home /></Layout>} />
          <Route path='/demo' element={<Layout><Page /></Layout>} />
          <Route path='/demoStepper' element={<Layout><DemoStepper /></Layout>} />
          <Route path='/generadorFormularios' element={<Layout><GeneradorFormularios /></Layout>} />
          <Route path='/recepcion' element={<Layout><RecepcionMercancia /></Layout>} />
          <Route path='/catalogos' element={<Layout><Catalogos /></Layout>} />
          <Route path='/cat_AreasDeptosClases' element={<Layout><CatAreasDeptosClases/></Layout>} />
         <Route path='/cat_Tipo_Descuento' element={<Layout><CatTipoDescuentos/></Layout>} />
         <Route path='/cat_Compradores' element={<Layout><CatCompradores/></Layout>} />
          <Route path='/cat_Marcas' element={<Layout><CatMarcas/></Layout>} />
          <Route path='/cat_Sucursales' element={<Layout><CatSucursales/></Layout>} />
         <Route path='/cat_Clientes' element={<Layout><CatCliente/></Layout>} />
         <Route path='/AsignacionHorarios' element={<Layout><AsignacionHorarios/></Layout>} />
         <Route path='/Cat_Marcas_Familias' element={<Layout><Cat_MarcasFamilias/></Layout>} />
         <Route path='/Cat_Proveedores' element={<Layout><CatProveedores/></Layout>} />
         <Route path='/modulo_servicios_insumos' element={<Layout><AdministracionServiciosInsumos/></Layout>} />
         <Route path='/modulo_porcentajes_puntos' element={<Layout><AdministracionPorcentajesPuntos/></Layout>} />
         <Route path='/cat_Productos' element={<Layout><CatProductos/></Layout>} />
         <Route path='/config_promociones_descuento_porcentual' element={<Layout><ConfiguracionPromocionesDescuentoPorcentual/></Layout>} /> 
          <Route path='/ajustemasivoprecios' element={<Layout><AjusteMasivoPrecios/></Layout>} />
          <Route path='/cat_metaempleados' element={<Layout><MetasEmpleados/></Layout>} />
          <Route path='/cat_metasucursal' element={<Layout><MetasSucursales/></Layout>} />
          <Route path='/cat_configcomisiones' element={<Layout><ConfigComisiones/></Layout>} />
          <Route path='/cat_configcomisiones2' element={<Layout><ConfigComisiones2/></Layout>} />
          <Route path='/cat_accesosalternos' element={<Layout><AccesosAlternos/></Layout>} />
          <Route path='/cat_conceptos_ajustes' element={<Layout><ConceptosAjustes/></Layout>} />
          <Route path='/cat_tipos_movimientos' element={<Layout><TiposMovimientos/></Layout>} />

        
         <Route path='/Cat_Plasticos_Autorizados' element={<Layout><PlasticosAutorizados/></Layout>} />
         <Route path='/cat_medios_pago' element={<Layout><MediosPagos/></Layout>} />
         <Route path='/cat_DescProveedores' element={<Layout><DescuentoProveedores/></Layout>} />
         <Route path='/cat_proveedores_acreedores' element={<Layout><ProveedoresAcreedores/></Layout>} />
         <Route path='/cat_trabajadores' element={<Layout><CatTrabajadores/></Layout>} />
         <Route path='/cat_nomina_departamentos' element={<Layout><CatNominaDepartamentos/></Layout>} />
         <Route path='/cat_nomina_status' element={<Layout><CatNominaStatus/></Layout>} />
         <Route path='/cat_nomina_formas_pagos' element={<Layout><CatNominaFormasPagos/></Layout>} />
         <Route path='/cat_nomina_puestos' element={<Layout><CatNominaPuestos/></Layout>} />
         <Route path='/cat_nomina_bajas' element={<Layout><CatNominaBajas/></Layout>} />
         <Route path='/factores_sucursal' element={<Layout><FactoresSucursales/></Layout>} />

          <Route path='/cat_nominas_movimientos' element={<Layout><NominasMovimientos/></Layout>} />
          <Route path='/cat_dias_festivos' element={<Layout><DiasFestivos/></Layout>} />
          <Route path='/cat_niveles_estudios_rrhh' element={<Layout><NivelesEstudios/></Layout>} />
          <Route path='/cat_nominas_horarios' element={<Layout><NominasHorarios/></Layout>} />
          <Route path='/cat_cuentas_bancarias' element={<Layout><CuentasBancarias/></Layout>} />
          <Route path='/cat_tipos_cuentas' element={<Layout><TiposCuentas/></Layout>} />
          <Route path='/cat_usuarios' element={<Layout><Usuarios/></Layout>} />
          <Route path='/cat_nominas_folios' element={<Layout><FoliosNomina/></Layout>} />
          <Route path='/Cat_turnos_dobles' element={<Layout><TurnosDobles/></Layout>} />
          <Route path='/cat_perfiles_permisos' element={<Layout><CatPerfilesPermisos/></Layout>} />
          <Route path='/cat_Categorias' element={<Layout><CatCategorias/></Layout>} />
           <Route path='/cat_PermisosDeptos' element={<Layout><CatPermisosDeptos/></Layout>} />
           <Route path='/validacion_productos_servicios' element={<Layout><ValidacionProductosServicios/></Layout>} />
           <Route path='/cartelera-digital' element={<Layout><CarteleraDigital /></Layout>} />
           <Route path='/facturacion' element={<Layout><Facturacion /></Layout>} />
           <Route path='/pos2' element={<Layout><POS/></Layout>} />
          
          


       

          

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
            path='/cat_AreasDeptosClases'
            element={
              <Layout>
                <CatAreasDeptosClases />
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
          path='/modulo-servicios-insumos'
          element={
            <Layout>
              <AdministracionServiciosInsumos />
            </Layout>
          }
          />
          <Route
          path='/modulo_porcentajes_puntos'
          element={
            <Layout>
              <AdministracionPorcentajesPuntos />
            </Layout>
          }
          />
          <Route
          path='/config_promociones_descuento_porcentual'
          element={
            <Layout>
              <ConfiguracionPromocionesDescuentoPorcentual/>
            </Layout>
          }
          />
          <Route
          path='/retiros'
          element={
            <Layout>
              <Retiros/>
            </Layout>
          }
          />
          <Route
          path='/corte-parcial'
          element={
            <Layout>
              <CorteParcial/>
            </Layout>
          }
          />
          <Route
          path='/corte-dia'
          element={
            <Layout>
              <CorteDia/>
            </Layout>
          }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
