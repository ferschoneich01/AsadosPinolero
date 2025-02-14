class Pago:
    def __init__(self, pagoid, deudaid, montoabono, fechapago):
        self.pagoid = pagoid
        self.deudaid = deudaid
        self.montoabono = montoabono
        self.fechapago = fechapago

    def to_json(self):
        return {
            'pagoid': self.pagoid,
            'deudaid': self.deudaid,
            'montoabono': self.montoabono,
            'fechapago': self.fechapago
        }
