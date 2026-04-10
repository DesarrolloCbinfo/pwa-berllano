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

  const comercialesItems = [
    //Proveedores
    { id: 'proveedores', title: 'Proveedores', path: routes.cat_Proveedores },
    //Productos
    { id: 'productos', title: 'Productos', path: routes.cat_Productos },
    //Areas Departamentos y Clases
    { id: 'areas', title: 'Áreas, Deptos y Clases', path: routes.cat_AreasDeptosClases },
    //Catalogo de Marcas
    { id: 'marcas', title: 'Marcas', path: routes.cat_Marcas },
    //Marcas-Familias
    { id: 'marcasFamilias', title: 'Marcas Familias', path: routes.Cat_Marcas_Familias },
    //Clientes
    { id: 'clientes', title: 'Clientes', path: routes.cat_Clientes },
    //Alta de Plasticos Autorizados
    { id: 'plasticos', title: 'Plásticos Autorizados', path: routes.cat_Plasticos_Autorizados },
    //Administracion de Puntos
    { id: 'porcentajesPuntos', title: 'Porcentajes y Puntos', path: routes.modulo_porcentajes_puntos },
    //Tipos de descuento
    { id: 'tipoDescuento', title: 'Tipo Descuentos', path: routes.cat_Tipo_Descuento },
    //Administracion Insumos Servicios
    { id: 'serviciosInsumos', title: 'Servicios e Insumos', path: routes.modulo_servicios_insumos },
    //Configuracion de factores
    { id: 'factores', title: 'Factores Sucursales', path: routes.factores_sucursal },
    //Promociones Descto %
    { id: 'promociones', title: 'Promociones', path: routes.config_promociones_descuento_porcentual },
    //Descuento Proveedores
    { id: 'descProveedores', title: 'Desc. Proveedores', path: routes.cat_DescProveedores },
  ];

  const administracionyfinanzasItems = [
    //Sucursales
    { id: 'sucursales', title: 'Sucursales', path: routes.cat_Sucursales },
    //Compradores
    { id: 'compradores', title: 'Compradores', path: routes.cat_Compradores },
    //Medios de pago
    { id: 'mediosPago', title: 'Medios de Pago', path: routes.cat_Medios_Pago },
    //Categorias de gastos
    { id: 'categoriasGastos', title: 'Categorías de Gastos', path: routes.cat_Categorias },
    //Proveedores Admon
    { id: 'provAcreedores', title: 'Prov. Acreedores', path: routes.cat_Proveedores_Acreedores },
  ];

  const RRHHItems = [
    //Lista de trabajadores y //Ficha de empleados
    { id: 'trabajadores', title: 'Trabajadores', path: routes.cat_Trabajadores },
    //Departamentos
    { id: 'nominaDeptos', title: 'Deptos. Nómina', path: routes.cat_nomina_departamentos },
    //Status
    { id: 'nominaStatus', title: 'Status Nómina', path: routes.cat_nomina_Status },
    //Bajas
    { id: 'nominaBajas', title: 'Bajas Nómina', path: routes.cat_nomina_bajas },
    //Formas de Pagos
    { id: 'nominaFormasPago', title: 'Formas de Pago', path: routes.cat_nomina_formas_pagos },
    //Puestos
    { id: 'nominaPuestos', title: 'Puestos Nómina', path: routes.cat_nomina_puestos },
    //Horarios
    { id: 'nominasHorarios', title: 'Horarios', path: routes.cat_nominas_horarios },
    //Niveles escolares
    { id: 'nivelesEstudios', title: 'Niveles Estudios', path: routes.cat_niveles_estudios_rrhh },
    //Dias festivos
    { id: 'diasFestivos', title: 'Días Festivos', path: routes.cat_dias_festivos },
    //Movimientos
    { id: 'movimientos', title: 'Movimientos', path: routes.cat_nominas_movimientos },
    //Tipos de Movimientos
    { id: 'tiposMovimientos', title: 'Tipos Movimientos', path: routes.cat_tipos_movimientos },
    //Conceptos de Ajustes
    { id: 'conceptosAjustes', title: 'Conceptos Ajustes', path: routes.cat_conceptos_ajustes },
    //Accesos alternos
    { id: 'accesosAlternos', title: 'Accesos Alternos', path: routes.cat_accesosalternos },
    //Comisiones
    { id: 'comisiones', title: 'Comisiones', path: routes.cat_configcomisiones },
    //Comisiones 2
    { id: 'comisiones2', title: 'Comisiones 2', path: routes.cat_configcomisiones2 },
    //Meta Sucursal
    { id: 'metaSucursal', title: 'Meta Sucursal', path: routes.cat_metasucursal },
    //Meta Empleados
    { id: 'metaEmpleados', title: 'Meta Empleados', path: routes.cat_metaempleados },
  ];


   const contabilidadItems = [
    //Catalogos de Tipos de Cuenta
    { id: 'tiposCuentas', title: 'Tipos Cuentas', path: routes.cat_tipos_cuentas },
    //Cuentas Bancarias
    { id: 'cuentasBancarias', title: 'Cuentas Bancarias', path: routes.cat_cuentas_bancarias },
  ];

  const seguridadyaccesoItems = [
    //Usuarios del sistema
    { id: 'usuarios', title: 'Usuarios', path: routes.cat_usuarios },
    //Perfiles y permisos
    { id:'perfilesPermisos', title: 'Perfiles y Permisos', path: routes.cat_perfiles_permisos },
    //Permisos por departamento comercial
    { id:'permisosDeptos', title: 'Permisos por Deptos', path: routes.cat_PermisosDeptos },
  ];

  const comercialItems = [
    { id: 'retiros', title: 'Retiros', path: routes.retiros },
    { id: 'corteParcial', title: 'Corte Parcial', path: routes.corte_parcial },
    { id: 'corteDia', title: 'Corte Día', path: routes.corte_dia },
    
    
  ];
  const rrhhItems = [
    
    
    
    
    
    
    { id: 'asignacionHorarios', title: 'Asignación Horarios', path: routes.AsignacionHorarios },
    
    
    { id: 'folios', title: 'Folios Nómina', path: routes.cat_nominas_folios },
    
    
    { id: 'turnosDobles', title: 'Turnos Dobles', path: routes.cat_turnos_dobles },
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
                  Comerciales
                </h3>
                <div className={styles.catalogsGrid}>
                  {comercialesItems.map((catalog) => (
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
                  Administración y finanzas
                </h3>
                <div className={styles.catalogsGrid}>
                  {administracionyfinanzasItems.map((catalog) => (
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
                  RRHH
                </h3>
                <div className={styles.catalogsGrid}>
                  {RRHHItems.map((catalog) => (
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
                  Contabilidad
                </h3>
                <div className={styles.catalogsGrid}>
                  {contabilidadItems.map((catalog) => (
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
                  Seguridad y Acceso
                </h3>
                <div className={styles.catalogsGrid}>
                  {seguridadyaccesoItems.map((catalog) => (
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
