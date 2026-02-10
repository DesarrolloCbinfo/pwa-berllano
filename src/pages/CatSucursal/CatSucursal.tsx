import React, { useState, useEffect } from 'react';
import { Container, Label, ButtonGroup, Button } from 'reactstrap';
import { MaterialReactTable } from 'material-react-table';
import { MRT_ColumnDef } from 'material-react-table';
import HomeIcon from '@mui/icons-material/Home';
import { ICatSucursal } from './interfaces/ICatSucursal';
import useConsumoApi from '../../hooks/useConsumoApi';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check'; 
import ClearIcon from '@mui/icons-material/Clear';
import Swal from 'sweetalert2';
import { TitlePlural, TitleSingular } from './titles';
import CatSucursalForm from './components/CatSucursalForm';
import { CatSucursalApis } from './apis/CatSucursalApis';
import SidebarHorizontal from '../../components/SideBarHorizontal';
import useSeguridad from '../../hooks/useSeguridad';
import { CatSucursalPermissions } from './permissions/CatSucursalPermissions';
import usePermisos from '../../hooks/usePermisos';
import { SwalMessagesPermissions } from '../../utils/SwalMessages';
import useSession from '../../hooks/useSession';
import useFetchData from '../../hooks/useFetchData';
import { ICatCias } from '../CatCias/interfaces/ICatCias';
import { CatCiasApis } from '../CatCias/apis/CatCiasApis';
import { useQuery } from '@tanstack/react-query';

enum FormType {
  add,
  edit
}

export default function CatSucursal() {
  useSeguridad(CatSucursalPermissions.view);

  const navigate = useNavigate();

  const { consumoApi } = useConsumoApi();

  const session = useSession()

  const dataEmpresas = useFetchData<ICatCias>(CatCiasApis.get)

  const deletePermission = usePermisos(CatSucursalPermissions.del)
  const addPermission = usePermisos(CatSucursalPermissions.add)
  const editPermission = usePermisos(CatSucursalPermissions.upd)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['catSucursal'],
    queryFn: (): Promise<ICatSucursal[]> => consumoApi.get(CatSucursalApis.get).then((res) => res.data),
  })

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<ICatSucursal>({
    sucursalId: 0,
    ciaId: 0,
    nombre: "",
    direccion: "",
    esBodega: false,
    enLinea: false,
    descripcionTicket: "",
    lPrecio: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    switch (e.target.type) {
      case "checkbox":
        setForm({
          ...form,
          [e.target.name]: e.target.checked
        });
        break;
      default:
        setForm({
          ...form,
          [e.target.name]: e.target.value
        });
        break;
    }
  };

  const handleDelete = (id: number) => {
    if (!deletePermission) {
      Swal.fire(SwalMessagesPermissions.delete)
      return
    }

    Swal.fire({
      title: `¿ELIMINAR ${TitleSingular}?`,
      text: "No se puede revertir esta acción",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, estoy seguro",
    })
      .then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await consumoApi.delete(CatSucursalApis.delete(id, session?.id));

            Swal.fire({
              title: "Exitoso",
              text: `${response.data.mensaje1}`,
              icon: "success",
            });

            refetch();
          } catch (error) {
            Swal.fire({
              title: "Error",
              text: `${error}`,
              icon: "error",
            });

            console.log(error);
          }
        }
      });
  };

  const handleRedirect = () => {
    navigate("/main-menu");
  };
  // Recargar la página actual
  const handleReload = () => {
    window.location.reload();
  };

  //Abrir y Cerrar Form
  const handleOpenForm = (type: FormType, form?: ICatSucursal) => {
    switch (type) {
      case FormType.add:
        if (!addPermission) {
          Swal.fire(SwalMessagesPermissions.add)
          return
        }

        setForm({
          sucursalId: 0,
          ciaId: 0,
          nombre: "",
          direccion: "",
          esBodega: false,
          enLinea: false,
          descripcionTicket: "",
          lPrecio: 0
        });
        break;
      case FormType.edit:
        if (!editPermission) {
          Swal.fire(SwalMessagesPermissions.update)
          return
        }

        if (form) {
          setForm(form);
        }
        break;
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  //POST y PUT exitos handleSuccess
  const handleSuccess = () => {
    handleCloseForm();
    setForm({
      sucursalId: 0,
      ciaId: 0,
      nombre: "",
      direccion: "",
      esBodega: false,
      enLinea: false,
      descripcionTicket: "",
      lPrecio: 0
    });
    refetch(); // Recargar la lista después de agregar/editar
  };

  const columns: MRT_ColumnDef<ICatSucursal>[] = [
    {
      accessorKey: "actions",
      header: "Acciones",
      size: 50,
      Cell: ({ row }) => (
        <div>
          <EditIcon color='warning' style={{ cursor: "pointer" }} onClick={() => handleOpenForm(FormType.edit, row.original)}></EditIcon>
          <DeleteIcon color='error' style={{ cursor: "pointer" }} onClick={() => handleDelete(row.original.sucursalId)}></DeleteIcon>
        </div>
      ),
    },
    { 
      accessorKey: "ciaId",
      header: "Cia",
      Cell: ({ row }) => (
        <>
          { dataEmpresas.find((empresa) => empresa.id === row.original.ciaId)?.nombre }
        </>
      )
    },
    { accessorKey: "nombre", header: "Nombre" },
    { accessorKey: "direccion", header: "Dirección" },
    {
      accessorKey: "esBodega",
      header: "Bodega",
      Cell: ({ row }) => (
        row.original.esBodega
          ? <CheckIcon color='success'></CheckIcon>
          : <ClearIcon color='error'></ClearIcon>
      )
    },
    {
      accessorKey: "enLinea",
      header: "En Linea",
      Cell: ({ row }) => (
        row.original.enLinea
          ? <CheckIcon color='success'></CheckIcon>
          : <ClearIcon color='error'></ClearIcon>
      )
    },
    { accessorKey: "descripcionTicket", header: "Descripción Ticket" },
    { accessorKey: "lPrecio", header: "Precio" },
  ];

  return (
    <>
      <SidebarHorizontal />
      {openForm && (
        <CatSucursalForm
          form={form}
          handleChange={handleChange}
          onCancel={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}
      <Container>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: 0,
            padding: 0,
            height: 70,
          }}
        >
          <Label tag={"h1"}>
            Catálogo de {TitlePlural}
          </Label>
        </div>
        <div>
          <ButtonGroup variant="contained" aria-label="outlined primary button group">
            <Button
              color="success"
              onClick={() => handleOpenForm(FormType.add)}
            >
              Agregar {TitleSingular}
            </Button>
            <Button color="primary" onClick={handleRedirect}>
              <HomeIcon></HomeIcon>
            </Button>
            <Button onClick={handleReload}>
              <RefreshIcon></RefreshIcon>
            </Button>
          </ButtonGroup>
        </div>
        <br />
        <MaterialReactTable
          columns={columns}
          data={data?? []}
          enableColumnActions={false}
          initialState={{
            density: "compact",
            pagination: { pageIndex: 0, pageSize: 5 }
          }} 
          state={{
            isLoading: isLoading
          }}
        />
      </Container>
    </>
  );
}