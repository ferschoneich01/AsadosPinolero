from flask import Flask, jsonify
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from funciones import *
from sqlalchemy.sql import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import json


#objeto
from .entities.Venta import Venta
from .entities.DetalleVenta import DetalleVenta
from .entities.Deuda import Deuda

app = Flask(__name__)

# Check for environment variable
if not os.getenv("DATABASE_URL"):
    raise RuntimeError("DATABASE_URL is not set")

# Set up database
engine = create_engine(os.getenv("DATABASE_URL"))
db = scoped_session(sessionmaker(bind=engine))

class VentaModel:

    @classmethod
    def get_sales(self):
        "Obtener todas las ventas"
        try:
            ListaVentas = []
            ventas = db.execute(text("SELECT * FROM dbo.obtenerventas()")).fetchall()
            db.commit()

            # Formatear los resultados en una lista
            for venta in ventas:
                ListaVentas.append({
                    'ventaid': venta[0],
                    'clienteid': venta[1],
                    'nombres' : venta[2],
                    'apellidos' : venta[3],
                    'fechaventa': venta[4].strftime('%d-%m-%Y %H:%M'),
                    'tipoventa': venta[5],
                    'observacion': venta[6],
                    'estadoventa': venta[7],
                    'montoventa': venta[8]
                })
            return ListaVentas
        except Exception as ex:
            raise Exception(ex)
        
    @classmethod
    def get_salesPending(self):
        "Obtener todas las ventas pendientes de entrega"
        try:
            ListaVentas = []
            ventas = db.execute(text("SELECT * FROM dbo.obtenerventaspendientes()")).fetchall()
            db.commit()

            # Formatear los resultados en una lista
            for venta in ventas:
                ListaVentas.append({
                    'ventaid': venta[0],
                    'clienteid': venta[1],
                    'nombres' : venta[2],
                    'apellidos' : venta[3],
                    'fechaventa': venta[4].strftime('%d-%m-%Y %H:%M'),
                    'tipoventa': venta[5],
                    'observacion': venta[6],
                    'estadoventa': venta[7],
                    'montoventa': venta[8]
                })
            return ListaVentas
        except Exception as ex:
            raise Exception(ex)
        
    @classmethod
    def get_salesById(self, sale_id, tienePagoInicial):
        "Obtener ventas por id"
        try:
            VentaQuery = db.execute(text("SELECT * FROM dbo.ventas WHERE ventaid=:ventaid"), {"ventaid": sale_id}).fetchall()
            
            db.commit()

            cliente = db.execute(text("SELECT * FROM dbo.clientes WHERE clienteid=:clienteid"), {"clienteid": VentaQuery[0][1]}).fetchall()
            pagoInicial = 0

            if tienePagoInicial == 1:
                query = text("SELECT * FROM dbo.obtenerpagos(:client_id)")
                pagos = db.execute(query, {'client_id': cliente[0][0]}).fetchall()
                pagoInicial = pagos[0][2]


            # Formatear los resultados en una lista
            venta = {
                    'ventaid': VentaQuery[0][0],
                    'cedula': cliente[0][4],
                    'nombres' : cliente[0][1],
                    'apellidos' : cliente[0][2],
                    'fechaventa': VentaQuery[0][3].strftime('%d-%m-%Y %H:%M'),
                    'tipoventa': VentaQuery[0][4],
                    'observacion': VentaQuery[0][5],
                    'montoPago': pagoInicial
                }
            return venta
        except Exception as ex:
            raise Exception(ex)
        
    #Obtener los detalles de las ventas
    @classmethod
    def get_productos_by_sales(cls, ventaid):
        """Obtener los productos asociados a una venta específica"""
        try:
            query = text("SELECT * FROM dbo.obtenerproductosporventa(:ventaid)")
            productos = db.execute(query, {"ventaid": ventaid}).fetchall()

            db.commit()

            # Convertir los resultados a una lista de diccionarios
            lista_productos = [
                {
                    'productoid': producto[0],
                    'nombre': producto[1],
                    'descripcion': producto[2],
                    'cantidad': producto[3],
                    'preciounitario': float(producto[4])
                }
                for producto in productos
            ]
            
            return lista_productos
        except Exception as ex:
            db.rollback()
            raise Exception(f"Error obteniendo los productos de la venta: {ex}")
    
    #Obtener ventas por cliente
    @classmethod
    def get_salescustomer(cls, clienteid):
        """Obtener las ventas filtradas por cliente"""
        try:
            ListaVentasCustomer = []

            # Llamar a la función almacenada pasándole el clienteid como parámetro
            query = text("SELECT * FROM dbo.obtenerventasporcliente(:clienteid)")
            ventas = db.execute(query, {"clienteid": clienteid}).fetchall()

            db.commit()

            # Formatear los resultados en una lista de diccionarios
            for venta in ventas:
                ListaVentasCustomer.append({
                    'ventaid': venta[0],
                    'clienteid': venta[1],
                    'nombres' : venta[2],
                    'apellidos' : venta[3],
                    'fechaventa': venta[4],
                    'tipoventa': venta[5],
                    'observacion': venta[6],
                    'estadoventa': venta[7],
                    'montoventa': venta[8]
                })

            return ListaVentasCustomer

        except Exception as ex:
            db.rollback()
            raise Exception(f"Error obteniendo las ventas del cliente: {ex}")


    @staticmethod
    def saveSale(cliente_id, usuario_id, tipo_venta, tipo_entrega, productos,montoPagoInicial, observacion, fechaVenta):
        estado_venta = 1

        try:
            #Valida si es un encargo y lo pone en estado pendiente
            if tipo_entrega == 'Encargo':
                estado_venta=3
            # Convertir los productos a formato JSON para pasarlos al procedimiento almacenado
            productos_json = json.dumps(productos)  # Serializar la lista de productos como JSON
        
            # Ejecutar el procedimiento almacenado
            result = db.execute(text("SELECT dbo.registrar_venta(:p_cliente_id, :p_usuario_id, :p_tipo_venta, :p_productos,:p_montoabonado,:p_fechaVenta, :p_estado_venta, :p_observacion)"), {
                'p_cliente_id': cliente_id,
                'p_usuario_id': usuario_id,
                'p_tipo_venta': tipo_venta,
                'p_productos': productos_json,
                'p_montoabonado':str(montoPagoInicial),
                'p_observacion': observacion,
                'p_estado_venta': estado_venta,
                'p_fechaVenta':fechaVenta
            })

            venta_id = result.fetchone()[0]

            db.commit()  # Confirmar la transacción

        
            return venta_id
        
        except SQLAlchemyError as e:
            db.rollback()  # Revertir la transacción si hay errores
            print("Error de SQLAlchemy:", str(e))  # Imprimir el error en la consola
            return jsonify({"status": "error", "mensaje": str(e)}), 500

        except Exception as ex:
            print("Error inesperado:", str(ex))  # Imprimir el error en la consola
            return jsonify({"status": "error", "mensaje": "Error al procesar la venta: " + str(ex)}), 500

    # Función para validar los datos de la venta
    def validar_datos_venta(cliente_id, usuario_id, tipo_venta, productos):
        if not cliente_id or not usuario_id:
            return False, "El ID del cliente y del usuario son obligatorios."

        if not productos or len(productos) == 0:
            return False, "Debe haber al menos un producto en la venta."

        if tipo_venta not in ['Contado', 'Credito']:
            return False, "El tipo de venta debe ser 'Contado' o 'Credito'."

        for producto in productos:
            if 'productoid' not in producto or 'cantidad' not in producto or 'preciounitario' not in producto:
                return False, "Cada producto debe tener un ID, cantidad y precio unitario."

            if producto['cantidad'] <= 0 or producto['precio'] <= 0:
                return False, "La cantidad y el precio unitario deben ser mayores que cero."

        return True, ""

    @classmethod
    def delete_sale(cls, venta_id):
        """Eliminar una venta y sus dependencias (detalle de ventas, deudas, pagos)"""
        try:

            db.execute(text("CALL dbo.eliminar_venta(:venta_id)"), {"venta_id": venta_id})
            db.commit()

            return jsonify({"status": "success", "message": f"Venta {venta_id} y sus dependencias eliminadas correctamente."}), 200
        except IntegrityError as e:
            db.rollback()  # Revertir en caso de error de integridad referencial
            return jsonify({"status": "error", "message": "Error de integridad referencial al eliminar la venta.", "details": str(e)}), 500
        except SQLAlchemyError as e:
            db.rollback()  # Revertir en caso de error de SQLAlchemy
            return jsonify({"status": "error", "message": "Error de base de datos al eliminar la venta.", "details": str(e)}), 500
        except Exception as ex:
            db.rollback()  # Revertir en caso de error inesperado
            return jsonify({"status": "error", "message": "Error inesperado al eliminar la venta.", "details": str(ex)}), 500
        
    @classmethod
    def get_sales_historica(cls, fecha_inicio, fecha_fin=None):
        """Obtener las ventas históricas en una fecha específica o en un rango de fechas"""
        try:
            # Verificar si se usa solo fecha de inicio o también fecha fin
            if fecha_fin:
                # Llamada a la función almacenada con rango de fechas
              result = db.execute(
                    text("SELECT * FROM dbo.listarventashistorica(:fecha_inicio, :fecha_fin)"),
                    {'fecha_inicio': fecha_inicio, 'fecha_fin': fecha_fin}
                )
            else:
                # Llamada a la función almacenada solo con fecha de inicio
                result = db.execute(
                    text("SELECT * FROM dbo.listarventashistorica(:fecha_inicio)"),
                    {'fecha_inicio': fecha_inicio}
                )

            # Convertir el resultado a una lista de diccionarios
            lista_ventas = [
                {
                    'ventaid': row[0],
                    'nombre_cliente': row[1],
                    'monto_total': float(row[2]),
                    'tipoventa' : row[3],
                    'estadoventa': row[4],
                    'fechaventa': row[5].strftime('%d-%m-%Y %H:%M')
                }
                for row in result
            ]

            return lista_ventas

        except Exception as ex:
            db.rollback()  # Revertir la transacción en caso de error
            raise Exception(f"Error al obtener ventas históricas: {ex}")

    @classmethod
    def deliverOrder(cls, ventaid):
        "Actualizar el estado de una venta específica a estado 1 (entregada)"
        try:
            # Ejecutar la consulta de actualización
            db.execute(text("UPDATE dbo.ventas SET estadoventa = 1 WHERE ventaid = :ventaid"), {'ventaid': ventaid})
            db.commit()
            return True
        except Exception as ex:
            db.rollback()  # Revertir cambios en caso de error
            return jsonify({"status": "error", "mensaje": "Error al procesar la entrega: " + str(ex)}), 500
    


