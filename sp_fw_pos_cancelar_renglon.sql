USE [ApiBerllano]
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_fw_pos_cancelar_renglon]
    @cia INT = 1,
    @sucursal INT,
    @cve_cliente VARCHAR(20),
    @clave_prod VARCHAR(50),
    @hora VARCHAR(20),
    @estilista VARCHAR(20),
    @auxiliar VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        DECLARE @filasAfectadas INT;

        -- Buscar y cancelar el renglón
        UPDATE dv SET 
            dv.cancelada = 1
        FROM [26.206.24.134].CBERP.dbo.detalle_ventas dv
        WHERE dv.Cia = @cia
          AND dv.Sucursal = @sucursal
          AND dv.Cve_cliente = @cve_cliente
          AND dv.Clave_prod = @clave_prod
          AND dv.[User] = @estilista
          AND dv.cancelada = 0
          AND dv.Fecha >= CAST(GETDATE() AS DATE); -- Solo cancelas de hoy

        SET @filasAfectadas = @@ROWCOUNT;

        IF @filasAfectadas = 0
        BEGIN
            SELECT 0 AS ok, 'No se encontró el renglón a cancelar' AS mensaje;
            RETURN;
        END

        -- Cancelar insumos asociados
        UPDATE dvi SET 
            dvi.observaciones = 'CANCELADO'
        FROM [26.206.24.134].CBERP.dbo.detalle_ventas_insumos dvi
        INNER JOIN [26.206.24.134].CBERP.dbo.detalle_ventas dv 
            ON dv.Cia = dvi.cia 
            AND dv.Sucursal = dvi.sucursal 
            AND dv.Cve_cliente = dvi.cve_cliente 
            AND dv.No_venta = dvi.no_venta
        WHERE dv.Cia = @cia
          AND dv.Sucursal = @sucursal
          AND dv.Cve_cliente = @cve_cliente
          AND dv.Clave_prod = @clave_prod
          AND dv.[User] = @estilista
          AND dv.cancelada = 1
          AND dv.Fecha >= CAST(GETDATE() AS DATE);

        SELECT 1 AS ok, 'Renglón cancelado correctamente' AS mensaje;

    END TRY
    BEGIN CATCH
        SELECT 0 AS ok, ERROR_MESSAGE() AS mensaje;
    END CATCH
END
