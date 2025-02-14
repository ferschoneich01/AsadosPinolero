from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from funciones import *
from sqlalchemy.sql import text
#objeto
from .entities.Usuario import Usuario

# Check for environment variable
if not os.getenv("DATABASE_URL"):
    raise RuntimeError("DATABASE_URL is not set")

# Set up database
engine = create_engine(os.getenv("DATABASE_URL"))
db = scoped_session(sessionmaker(bind=engine))

class UsuarioModel():

    @classmethod
    def get_users(self):
        try:
            ListaUsuario=[]
            usuarioCSL = db.execute(text(
                "SELECT * FROM dbo.usuarios")).fetchall()

            # Extraer los resultados
            db.commit()
            
            # Formatear los resultados en un diccionario
            for i in range(len(usuarioCSL)):
                user = Usuario(usuarioid=usuarioCSL[i][0],nombreusuario=usuarioCSL[i][1],codigousuario=usuarioCSL[i][6],
                            clave=usuarioCSL[i][2],estadousuario=usuarioCSL[i][3],
                            fechacreacion=usuarioCSL[i][4],correo=usuarioCSL[i][5])
                
                ListaUsuario.append(user.to_json())
                i+=1

            return ListaUsuario
        except Exception as ex:
            raise Exception(ex)
        

    @classmethod
    def get_userbyId(self, username):
        try:
            usuario = db.execute(text("SELECT * FROM dbo.buscar_usuario(:nombre_usuario)"),
                {'nombre_usuario': username}
            ).fetchall()

            # Extraer los resultados
            db.commit()

            return usuario
        except Exception as ex:
            raise Exception(ex)

    @classmethod
    def add_user(self, user):
        try:
            print(user["clave"])
            # Ejecutar el procedimiento almacenado para crear un usuario
            db.execute(
                text("CALL dbo.CrearUsuario(:nombre_usuario,:codigo_usuario, :clave, :estado_usuario, :correo)"),
                {'nombre_usuario': user["nombre_usuario"],'codigo_usuario': user["codigo_usuario"], 'clave': user["clave"], 'estado_usuario':True,'correo': user["correo"]}
            )

            
            # Confirmar la transacción (ya que estamos insertando datos)
            db.commit()

            return 1
        except Exception as ex:
            raise Exception(ex)
""""
    @classmethod
    def update_user(self, user):
        try:
            db.execute(text("UPDATE users set password = '"+str(user.password)+"', role = '"+str(user.role)+"', email = '"+str(user.email)+"', status_user = '"+str(user.status_user)+"'"
                            +"WHERE id_user = '"+str(user.id_user)+"'"))
            
            db.commit()
            db.close()
            return 1
        except Exception as ex:
            raise Exception(ex)
"""

@classmethod
def delete_user(self, user):
    try:
        db.execute(text("UPDATE usuario set estadousuario = 2 WHERE usuarioid = '"+str(user.id_user)+"'"))
        db.commit()
        return 1
    except Exception as ex:
        raise Exception(ex)