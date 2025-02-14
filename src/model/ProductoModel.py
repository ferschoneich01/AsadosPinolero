from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from funciones import *
from sqlalchemy.sql import text
#objeto
from .entities.Producto import Producto


# Check for environment variable
if not os.getenv("DATABASE_URL"):
    raise RuntimeError("DATABASE_URL is not set")

# Set up database
engine = create_engine(os.getenv("DATABASE_URL"))
db = scoped_session(sessionmaker(bind=engine))

class ProductoModel():

    @classmethod
    def get_products(self):
        try:
            lista_productos=[]
            
            productoCSL = db.execute(text(
                "SELECT * FROM dbo.obtenerproductos()")).fetchall()

            # Extraer los resultados
            db.commit()
            
            # Formatear los resultados en un diccionario
             # Convertir cada producto en un diccionario
            for producto in productoCSL:
                producto_dict = {
                    "productoid": str(producto[0]),   # Asegúrate de que los nombres de las claves coincidan con los campos reales
                    "nombre": producto[1],
                    "descripcion": producto[2]
                }
                lista_productos.append(producto_dict)
           
            return lista_productos
        except Exception as ex:
            raise Exception(ex)
        

    @classmethod
    def get_productById(self, name):
        try:
            usuario = db.execute(text("SELECT * FROM dbo.buscar_producto(:nombre)"),
                {'nombre': name}
            ).fetchall()

            # Extraer los resultados
            db.commit()

            return usuario
        except Exception as ex:
            raise Exception(ex)

    @classmethod
    def add_product(self, producto):
        try:
            # Ejecutar el procedimiento almacenado para crear un Producto
            db.execute(
                text("CALL dbo.guardar_producto(:nombre, :descripcion)"),
                producto.to_json()
            )
            # Confirmar la transacción (ya que estamos insertando datos)
            db.commit()

            return 1
        except Exception as ex:
            raise Exception(ex)

    @classmethod
    def update_product(cls, producto):
        try:
            db.execute(
                text("CALL dbo.actualizar_producto(:productoid, :nombre, :descripcion)"),
                {
                 'productoid': producto.productoid,
                 'nombre': producto.nombre,
                 'descripcion': producto.descripcion
                }
            )
            db.commit()

            return 1
        except Exception as ex:
            raise Exception(ex)


    @classmethod
    def delete_product(self, id):
        try:
            db.execute(
                text("CALL dbo.eliminar_producto(:producto_id)"),
                {'producto_id': id}
            )

            db.commit()
            return 1
        except Exception as ex:
            raise Exception(ex)

    from sqlalchemy import text

    @classmethod
    def report_carga(cls, fecha_hora_inicio, fecha_fin):
        try:
            # Ejecutar la función almacenada en PostgreSQL con fecha y hora de inicio y fecha de fin opcional
            result = db.execute(
                text("SELECT * FROM dbo.reportecarga(:fecha_hora_inicio, :fecha_fin)"),
                {'fecha_hora_inicio': fecha_hora_inicio, 'fecha_fin': fecha_fin}
            )
            print("Contenido de result:", result)
            
            # Convertir el resultado a una lista de diccionarios
            reporte = [{"producto": row[0], "total_vendido": row[1], "totalingresos": row[2]} for row in result]
    
            return reporte
        except Exception as ex:
            db.rollback()  # Revertir si hay algún error
            raise Exception(f"Error al ejecutar el reporte de carga: {ex}")
        
    @classmethod
    def report_utilidades(cls, fecha_hora_inicio, fecha_fin):
        try:
            # Ejecutar la función almacenada en PostgreSQL con fecha y hora de inicio y fecha de fin opcional
            result = db.execute(
                text("SELECT * FROM dbo.reporteutilidades(:fecha_hora_inicio, :fecha_fin)"),
                {'fecha_hora_inicio': fecha_hora_inicio, 'fecha_fin': fecha_fin}
            )
            print("Contenido de result:", result)
            
            # Convertir el resultado a una lista de diccionarios
            reporte = [{"producto": row[0], "total_vendido": row[1], "totalingresos": row[2]} for row in result]
    
            return reporte
        except Exception as ex:
            db.rollback()  # Revertir si hay algún error
            raise Exception(f"Error al ejecutar el reporte de carga: {ex}")
    
    @classmethod
    def get_productsby_monthyear(cls, mes, anio):
        try:
            # Ejecutar la función almacenada en PostgreSQL
            result = db.execute(
                text("SELECT * FROM dbo.obtenerproductosmesanio(:mes, :anio)"),
                {'mes': mes, 'anio': anio}
            ).fetchall()

            # Convertir el resultado a una lista de diccionarios
            top_productos = [
                {
                    "productoid": row[0],
                    "nombreproducto": row[1],
                    "cantidadvendida": row[2]
                }
                for row in result
            ]

            return top_productos
        except Exception as ex:
            db.rollback()  # Revertir si hay algún error
            raise Exception(f"Error al obtener el Top 8 de productos por mes y año: {ex}")
        