class Cliente:
    def __init__(self, clienteid, nombres, apellidos, telefono, cedula, direccion, fecharegistro):
        self.clienteid = clienteid
        self.nombres = nombres
        self.apellidos = apellidos
        self.telefono = telefono
        self.cedula = cedula
        self.direccion = direccion
        self.fecharegistro = fecharegistro

    def to_json(self):
        return {
            'clienteid': self.clienteid,
            'nombres': self.nombres,
            'apellidos': self.apellidos,
            'telefono': self.telefono,
            'cedula': self.cedula,
            'direccion': self.direccion,
            'fecharegistro': self.fecharegistro
        }
