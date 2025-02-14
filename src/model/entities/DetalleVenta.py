class DetalleVenta:
    def __init__(self, detalleventaid, ventaid, productoid, cantidad, preciounitario):
        self.detalleventaid = detalleventaid
        self.ventaid = ventaid
        self.productoid = productoid
        self.cantidad = cantidad
        self.preciounitario = preciounitario

    def to_json(self):
        return {
            'detalleventaid': self.detalleventaid,
            'ventaid': self.ventaid,
            'productoid': self.productoid,
            'cantidad': self.cantidad,
            'preciounitario': self.preciounitario
        }
