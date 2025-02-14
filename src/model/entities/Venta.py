class Venta:
    def __init__(self, ventaid, clienteid, usuarioid, fechaventa, tipoventa, observacion, estadoventa):
        self.ventaid = ventaid
        self.clienteid = clienteid
        self.usuarioid = usuarioid
        self.fechaventa = fechaventa
        self.tipoventa = tipoventa
        self.observacion = observacion
        self.estadoventa = estadoventa

    def to_json(self):
        return {
            'ventaid': self.ventaid,
            'clienteid': self.clienteid,
            'usuarioid': self.usuarioid,
            'fechaventa': self.fechaventa,
            'tipoventa': self.tipoventa,
            'observacion': self.observacion,
            'estadoventa': self.estadoventa
        }
