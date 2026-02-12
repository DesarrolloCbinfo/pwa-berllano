import React from "react";
import {
  Button,
  Form,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
} from "reactstrap";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { ICatSucursal } from "../interfaces/ICatSucursal";
import Swal from "sweetalert2";
import { TitleSingular} from "../titles";
import { CatSucursalApis } from "../apis/CatSucursalApis";
import { FormSelectCiaId } from "../../../components/FormSelects";
import { FormInputDescripcionTicket, FormInputDireccion, FormInputNombre } from "../../../components/FormInputs";
import { FormInputNumberLPrecio } from "../../../components/FormInputsNumber";
import { FormCheckboxEnLinea, FormCheckboxEsBodega } from "../../../components/FormCheckboxes";
import useSession from "../../../hooks/useSession";

interface ProductosFreskyFormsProps {
  onSuccess: () => void;
  onCancel: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  form: ICatSucursal;
}

const CatSucursalForm: React.FC<ProductosFreskyFormsProps> = ({
  onSuccess,
  onCancel,
  handleChange,
  form,
}) => {
  const { consumoApi } = useConsumoApi();
  const session = useSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let response

    try {
      if (form.sucursalId === 0) {
        response = await consumoApi.post(CatSucursalApis.post(session?.id), form);

        Swal.fire({
          title: "Exitoso",
          text: `${response.data.mensaje1}`,
          icon: "success",
        });
      } else {
        response = await consumoApi.put(CatSucursalApis.put(session?.id), form);

        Swal.fire({
          title: "Exitoso",
          text: `${response.data.mensaje1}`,
          icon: "success",
        });
      }

      onSuccess()
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `${error}`,
        icon: "error",
      });

      console.log(form)
      console.log(error)
    }
  };

  return (
    <Modal isOpen={true} toggle={onCancel} size="lg">
      <ModalHeader toggle={onCancel}>
        {form.sucursalId > 0 ? "Editar" : "Agregar"} {TitleSingular}
      </ModalHeader>
      <ModalBody>
        <Form onSubmit={handleSubmit}>
          <Row className="mt-3">
            <FormSelectCiaId handleChange={handleChange} defaultValue={form.sucursalId > 0 ? form.ciaId : ""} />

            <FormInputNombre handleChange={handleChange} formValue={form.nombre} />
            <FormInputDireccion handleChange={handleChange} formValue={form.direccion} />
            <FormInputDescripcionTicket handleChange={handleChange} formValue={form.descripcionTicket} />

            <FormInputNumberLPrecio handleChange={handleChange} formValue={form.lPrecio} />
            <div>
              <FormCheckboxEsBodega handleChange={handleChange} formValue={form.esBodega} />
              <FormCheckboxEnLinea handleChange={handleChange} formValue={form.enLinea} />
            </div>
          </Row>
          <div className="d-flex justify-content-end gap-2">
            <Button color="primary">
              Guardar
            </Button>
            <Button color="secondary" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </Form>
      </ModalBody>
    </Modal>
  );
};

export default CatSucursalForm;
