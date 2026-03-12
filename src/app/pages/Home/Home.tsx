import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import SidebarHorizontal from '../../../components/SideBarHorizontal';
import {
  ShoppingCart,
  Folder,
  Settings,
  People,
  GridView,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Storefront,
  Inventory,
  Assessment,
} from '@mui/icons-material';
import { routes } from '../../../utils/Routes';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showCatalogs, setShowCatalogs] = useState(false);
  const [showRRHH, setShowRRHH] = useState(false);
  const [showComercial, setShowComercial] = useState(false);

  const mainActions = [
    { 
      id: 'pos', 
      title: 'Punto de Venta', 
      description: 'Sistema de ventas', 
      icon: ShoppingCart, 
      color: '#28a745', 
      path: routes.pos 
    },
    { 
      id: 'catalogs', 
      title: 'Catálogos', 
      description: 'Gestión de catálogos', 
      icon: Folder, 
      color: '#007bff', 
      action: () => setShowCatalogs(!showCatalogs) 
    },
    { 
      id: 'recepcion', 
      title: 'Recepción', 
      description: 'Recepción de mercancía', 
      icon: Inventory, 
      color: '#fd7e14', 
      path: routes.recepcion 
    },
    { 
      id: 'comercial', 
      title: 'Módulo Comercial', 
      description: 'Operaciones comerciales', 
      icon: Storefront, 
      color: '#17a2b8', 
      action: () => setShowComercial(!showComercial) 
    },
    { 
      id: 'rrhh', 
      title: 'Recursos Humanos', 
      description: 'Gestión de personal', 
      icon: People, 
      color: '#6f42c1', 
      action: () => setShowRRHH(!showRRHH) 
    },
  ];

  const organizacionItems = [
    { id: 'sucursales', title: 'Sucursales', path: routes.cat_Sucursales },
    { id: 'areas', title: 'Áreas', path: routes.cat_Areas },
    { id: 'marcas', title: 'Marcas', path: routes.cat_Marcas },
    { id: 'marcasFamilias', title: 'Marcas Familias', path: routes.Cat_Marcas_Familias },
  ];

  const productosItems = [
    { id: 'productos', title: 'Productos', path: routes.cat_Productos },
    { id: 'clientes', title: 'Clientes', path: routes.cat_Clientes },
    { id: 'proveedores', title: 'Proveedores', path: routes.cat_Proveedores },
    { id: 'compradores', title: 'Compradores', path: routes.cat_Compradores },
    { id: 'tipoDescuento', title: 'Tipo Descuentos', path: routes.cat_Tipo_Descuento },
    { id: 'promociones', title: 'Promociones', path: routes.config_promociones_descuento_porcentual },
    { id: 'ajustePrecios', title: 'Ajuste Masivo Precios', path: '/ajustemasivoprecios' },
  ];

  const serviciosItems = [
    { id: 'serviciosInsumos', title: 'Servicios e Insumos', path: routes.modulo_servicios_insumos },
    { id: 'porcentajesPuntos', title: 'Porcentajes y Puntos', path: routes.modulo_porcentajes_puntos },
  ];

  const rrhhItems = [
    { id: 'trabajadores', title: 'Trabajadores', path: routes.cat_Trabajadores },
    { id: 'nominaDeptos', title: 'Deptos. Nómina', path: routes.cat_nomina_departamentos },
    { id: 'nominaPuestos', title: 'Puestos Nómina', path: routes.cat_nomina_puestos },
    { id: 'nominaStatus', title: 'Status Nómina', path: routes.cat_nomina_Status },
    { id: 'nominaFormasPago', title: 'Formas de Pago', path: routes.cat_nomina_formas_pagos },
    { id: 'nominaBajas', title: 'Bajas Nómina', path: routes.cat_nomina_bajas },
    { id: 'asignacionHorarios', title: 'Asignación Horarios', path: routes.AsignacionHorarios },
    { id: 'nominasHorarios', title: 'Horarios', path: routes.cat_nominas_horarios },
    { id: 'diasFestivos', title: 'Días Festivos', path: routes.cat_dias_festivos },
    { id: 'folios', title: 'Folios Nómina', path: routes.cat_nominas_folios },
    { id: 'movimientos', title: 'Movimientos', path: routes.cat_nominas_movimientos },
    { id: 'nivelesEstudios', title: 'Niveles Estudios', path: routes.cat_niveles_estudios_rrhh },
    { id: 'turnosDobles', title: 'Turnos Dobles', path: routes.cat_turnos_dobles },
  ];

  const comercialItems = [
    { id: 'retiros', title: 'Retiros', path: routes.retiros },
    { id: 'corteParcial', title: 'Corte Parcial', path: routes.corte_parcial },
    { id: 'corteDia', title: 'Corte Día', path: routes.corte_dia },
    { id: 'plasticos', title: 'Plásticos Autorizados', path: routes.cat_Plasticos_Autorizados },
    { id: 'mediosPago', title: 'Medios de Pago', path: routes.cat_Medios_Pago },
    { id: 'factores', title: 'Factores Sucursales', path: routes.factores_sucursal },
  ];

  const nominaConfigItems = [
    { id: 'metaEmpleados', title: 'Meta Empleados', path: routes.cat_metaempleados },
    { id: 'metaSucursal', title: 'Meta Sucursal', path: routes.cat_metasucursal },
    { id: 'comisiones', title: 'Comisiones', path: routes.cat_configcomisiones },
    { id: 'comisiones2', title: 'Comisiones 2', path: routes.cat_configcomisiones2 },
    { id: 'cuentasBancarias', title: 'Cuentas Bancarias', path: routes.cat_cuentas_bancarias },
    { id: 'tiposCuentas', title: 'Tipos Cuentas', path: routes.cat_tipos_cuentas },
    { id: 'usuarios', title: 'Usuarios', path: routes.cat_usuarios },
    { id: 'accesosAlternos', title: 'Accesos Alternos', path: routes.cat_accesosalternos },
    { id: 'conceptosAjustes', title: 'Conceptos Ajustes', path: routes.cat_conceptos_ajustes },
    { id: 'tiposMovimientos', title: 'Tipos Movimientos', path: routes.cat_tipos_movimientos },
    { id: 'descProveedores', title: 'Desc. Proveedores', path: routes.cat_DescProveedores },
    { id: 'provAcreedores', title: 'Prov. Acreedores', path: routes.cat_Proveedores_Acreedores },
  ];

  return (
    <>
      
      <div className={styles.mainMenu}>
        <div className={styles.dashboardContainer}>
          <h1 className={styles.dashboardTitle}>Panel Principal</h1>
          
          <div className={styles.mainActions}>
            {mainActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  className={styles.actionCard}
                  style={{ backgroundColor: action.color }}
                  onClick={() => action.path ? navigate(action.path) : action.action?.()}
                >
                  <Icon className={styles.actionIcon} />
                  <div className={styles.actionContent}>
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>
                  {(action.id === 'catalogs' || action.id === 'rrhh' || action.id === 'comercial') && (
                    <span className={styles.expandIcon}>
                      {action.id === 'catalogs' 
                        ? (showCatalogs ? <KeyboardArrowDown /> : <KeyboardArrowRight />)
                        : action.id === 'rrhh'
                          ? (showRRHH ? <KeyboardArrowDown /> : <KeyboardArrowRight />)
                          : (showComercial ? <KeyboardArrowDown /> : <KeyboardArrowRight />)
                      }
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showCatalogs && (
            <div className={styles.catalogsSection}>
              <div className={styles.catalogSubsection}>
                <h3 className={styles.subsectionTitle}>
                  <GridView className={styles.sectionIcon} />
                  Organización
                </h3>
                <div className={styles.catalogsGrid}>
                  {organizacionItems.map((catalog) => (
                    <button
                      key={catalog.id}
                      className={styles.catalogCard}
                      onClick={() => navigate(catalog.path)}
                    >
                      <Folder className={styles.catalogIcon} />
                      <span>{catalog.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.catalogSubsection}>
                <h3 className={styles.subsectionTitle}>
                  <Inventory className={styles.sectionIcon} />
                  Productos
                </h3>
                <div className={styles.catalogsGrid}>
                  {productosItems.map((catalog) => (
                    <button
                      key={catalog.id}
                      className={styles.catalogCard}
                      onClick={() => navigate(catalog.path)}
                    >
                      <Folder className={styles.catalogIcon} />
                      <span>{catalog.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.catalogSubsection}>
                <h3 className={styles.subsectionTitle}>
                  <Settings className={styles.sectionIcon} />
                  Servicios
                </h3>
                <div className={styles.catalogsGrid}>
                  {serviciosItems.map((catalog) => (
                    <button
                      key={catalog.id}
                      className={styles.catalogCard}
                      onClick={() => navigate(catalog.path)}
                    >
                      <Folder className={styles.catalogIcon} />
                      <span>{catalog.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.catalogSubsection}>
                <h3 className={styles.subsectionTitle}>
                  <Assessment className={styles.sectionIcon} />
                  Config. Nómina
                </h3>
                <div className={styles.catalogsGrid}>
                  {nominaConfigItems.map((catalog) => (
                    <button
                      key={catalog.id}
                      className={styles.catalogCard}
                      onClick={() => navigate(catalog.path)}
                    >
                      <Folder className={styles.catalogIcon} />
                      <span>{catalog.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showRRHH && (
            <div className={styles.catalogsSection}>
              <div className={styles.catalogSubsection} style={{ gridColumn: '1 / -1' }}>
                <h3 className={styles.subsectionTitle}>
                  <People className={styles.sectionIcon} />
                  Recursos Humanos
                </h3>
                <div className={styles.catalogsGrid}>
                  {rrhhItems.map((catalog) => (
                    <button
                      key={catalog.id}
                      className={styles.catalogCard}
                      onClick={() => navigate(catalog.path)}
                    >
                      <Folder className={styles.catalogIcon} />
                      <span>{catalog.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showComercial && (
            <div className={styles.catalogsSection}>
              <div className={styles.catalogSubsection} style={{ gridColumn: '1 / -1' }}>
                <h3 className={styles.subsectionTitle}>
                  <Storefront className={styles.sectionIcon} />
                  Módulo Comercial
                </h3>
                <div className={styles.catalogsGrid}>
                  {comercialItems.map((catalog) => (
                    <button
                      key={catalog.id}
                      className={styles.catalogCard}
                      onClick={() => navigate(catalog.path)}
                    >
                      <Folder className={styles.catalogIcon} />
                      <span>{catalog.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
