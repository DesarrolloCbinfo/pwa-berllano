# Instrucciones para Agregar Dialog de Editar Cliente en POS.tsx

## Ubicación
Agregar después de la línea 1829 (después del Dialog de "Nuevo Cliente")

## Código a insertar:

```tsx
{/* Dialog para editar cliente */}
<Dialog
  maxWidth="lg"
  fullWidth
  open={modalEditarClienteOpen}
  onClose={() => setModalEditarClienteOpen(false)}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>Editar Cliente</DialogTitle>
  <DialogContent sx={{ p: 0 }}>
    <CatClientes
      embedded={true}
      openModal={modalEditarClienteOpen}
      onOpenModal={(open) => setModalEditarClienteOpen(open)}
      clienteToEdit={clienteSeleccionado}
      onClienteGuardado={(cliente) => {
        setClienteSeleccionado({
          No_cliente: cliente.No_cliente || cliente.nombre_completo,
          nombre: cliente.nombre || '',
          ap_paterno: cliente.ap_paterno || null,
          ap_materno: cliente.ap_materno || null
        });
        setModalEditarClienteOpen(false);
      }}
    />
  </DialogContent>
</Dialog>
```

## Estado ya agregado:
- Línea 151: `const [modalEditarClienteOpen, setModalEditarClienteOpen] = React.useState(false);`
- Línea 1442: Botón de Editar ya configurado con `setModalEditarClienteOpen(true)`

## Resultado:
El botón "Editar" abrirá el catálogo de clientes en modo edición con el cliente seleccionado.
