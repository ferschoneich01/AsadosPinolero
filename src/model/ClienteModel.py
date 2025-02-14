from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from funciones import *
from sqlalchemy.sql import text
#Objeto
from .entities.Cliente import Cliente

# Check for environment variable
if not os.getenv("DATABASE_URL"):
    raise RuntimeError("DATABASE_URL is not set")

# Set up database
engine = create_engine(os.getenv("DATABASE_URL"))
db = scoped_session(sessionmaker(bind=engine))

class ClienteModel:
    
    @classmethod
    def get_clients(self):
        """Obtener todos los clientes."""
        try:
            ListaClientes = []
            clientes = db.execute(text("SELECT * FROM dbo.clientes ORDER BY nombres")).fetchall()
            db.commit()

            # Formatear los resultados en una lista
            for cliente in clientes:
                ListaClientes.append({
                    'clienteid': cliente[0],
                    'nombres': cliente[1],
                    'apellidos': cliente[2],
                    'telefono': cliente[3],
                    'cedula': cliente[4],
                    'direccion': cliente[5],
                    'fecharegistro': cliente[6].strftime('%d/%m/%Y')
                })

            return ListaClientes
        except Exception as ex:
            raise Exception(ex)
        
    @classmethod
    def get_clientByID(self, client_id):
        """Obtener un cliente por su ID."""
        try:
            cliente = db.execute(text("SELECT * FROM dbo.clientes WHERE clienteid = :client_id"),
                                 {'client_id': client_id}).fetchone()
            db.commit()
                  
            if cliente:
                return {
                    'clienteid': cliente[0],
                    'nombres': cliente[1],
                    'apellidos': cliente[2],
                    'telefono': cliente[3],
                    'cedula': cliente[4],
                    'direccion': cliente[5],
                    'fecharegistro': cliente[6]
                }
            return cliente
        except Exception as ex:
            raise Exception(ex)

    @classmethod
    def get_clientById(self, cedula):
        """Obtener un cliente por su ID."""
        try:
            cliente = db.execute(text("SELECT * FROM dbo.clientes WHERE cedula = :cedula"),
                                 {'cedula': cedula}).fetchone()
            db.commit()
                  
            if cliente:
                return {
                    'clienteid': cliente[0],
                    'nombres': cliente[1],
                    'apellidos': cliente[2],
                    'telefono': cliente[3],
                    'cedula': cliente[4],
                    'direccion': cliente[5],
                    'fecharegistro': cliente[6]
                }
            return cliente
        except Exception as ex:
            raise Exception(ex)
        

    @classmethod
    def get_clientByTelf(self, telefono):
        """Obtener un cliente por su Numero de telefono."""
        try:
            cliente = db.execute(text("SELECT * FROM dbo.clientes WHERE telefono = :telefono"),
                                 {'telefono': telefono}).fetchone()
            db.commit()
                  
            if cliente:
                return {
                    'clienteid': cliente[0],
                    'nombres': cliente[1],
                    'apellidos': cliente[2],
                    'telefono': cliente[3],
                    'cedula': cliente[4],
                    'direccion': cliente[5],
                    'fecharegistro': cliente[6]
                }
            return cliente
        except Exception as ex:
            raise Exception(ex)
        
    @classmethod 
    def get_clientByName(cls, nombre):
            """Obtener un cliente por su nombre o apellido."""
            try:
                ListaClientes = []

                # Usa `fetchall()` para obtener múltiples resultados
                clientes = db.execute(
            text("SELECT * FROM dbo.clientes WHERE nombres ILIKE :nombre OR apellidos ILIKE :nombre ORDER BY nombres"),
            {'nombre': f"%{nombre}%"}

        ).fetchall()

                db.commit()
                
                # Recorre los resultados solo si `clientes` tiene datos
                for cliente in clientes:
                    ListaClientes.append({
                        'clienteid': cliente[0],
                        'nombres': cliente[1],
                        'apellidos': cliente[2],
                        'telefono': cliente[3],
                        'cedula': cliente[4],
                        'direccion': cliente[5],
                        'fecharegistro': cliente[6].strftime('%d/%m/%Y') if cliente[6] else None
                    })

                print(ListaClientes)    

                return ListaClientes
            except Exception as ex:
                raise Exception(f"Error al obtener clientes por nombre: {ex}")


    @classmethod
    def add_client(self, cliente):
        """Agregar un nuevo cliente."""
        try:
            # Ejecutar el procedimiento almacenado para crear un cliente
            db.execute(
                text("CALL dbo.guardar_cliente(:nombres, :apellidos, :telefono, :cedula, :direccion)"),
                cliente.to_json()
            )
            db.commit()

            return 1
        except Exception as ex:
            raise Exception(ex)

    @classmethod
    def update_client(cls, cliente):
        """Actualizar un cliente existente en la base de datos"""
        try:
            db.execute(
                text("CALL dbo.actualizar_cliente(:clienteid, :nombres, :apellidos, :telefono, :cedula, :direccion)"),
                {
                    'clienteid': cliente.clienteid,
                    'nombres': cliente.nombres,
                    'apellidos': cliente.apellidos,
                    'telefono': cliente.telefono,
                    'cedula': cliente.cedula,
                    'direccion': cliente.direccion
                }
            )
            db.commit()
            return 1
        except Exception as ex:
            raise Exception(ex)
        
    @classmethod
    def delete_client(self, id):
        try:
            db.execute(
                text("CALL dbo.eliminar_cliente(:clienteid)"),
                {'clienteid': id}
            )

            db.commit()
            return 1
        except Exception as ex:
            raise Exception(ex)

