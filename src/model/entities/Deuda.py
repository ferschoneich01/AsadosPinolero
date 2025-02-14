class Deuda:
    def __init__(self, deudaid, clienteid, ventaid, montodeuda, estadodeudas, fechacreacion):
        self.deudaid = deudaid
        self.clienteid = clienteid
        self.ventaid = ventaid
        self.montodeuda = montodeuda
        self.estadodeudas = estadodeudas
        self.fechacreacion = fechacreacion

    def to_json(self):
        return {
            'deudaid': self.deudaid,
            'clienteid': self.clienteid,
            'ventaid': self.ventaid,
            'montodeuda': self.montodeuda,
            'estadodeudas': self.estadodeudas,
            'fechacreacion': self.fechacreacion
        }
