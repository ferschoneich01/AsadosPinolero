from flask import Flask, render_template, jsonify, request, flash, redirect, redirect, url_for, session, make_response
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from sqlalchemy.exc import IntegrityError
from funciones import *
from datetime import datetime
from weasyprint import HTML, CSS
from datetime import datetime, timedelta
import pytz

import json
import uuid


#modelsTrue
from model.UsuarioModel import UsuarioModel 
from model.ProductoModel import ProductoModel
from model.ClienteModel import ClienteModel
from model.VentaModel import VentaModel
from model.DeudaModel import DeudaModel

#entities
from model.entities.Producto import Producto
from model.entities.Cliente import Cliente


app = Flask(__name__)

# Configure session to use filesystem

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=10) 

#lista producto
ProductsList = []

@app.route("/")
@login_required
def index():
    if request.cookies.get('username'):
        return redirect('/GestionVentas')
    else:
        return render_template("login.html", error=None)


@app.route("/login", methods=["POST", "GET"])
def login():
    if request.method == "POST":
        username = request.form.get("nombre_usuario")
        password = request.form.get("pass")

        # Validar campos vacíos
        if not username:
            return render_template("login.html", error="Ingrese un nombre de usuario")

        if not password:
            return render_template("login.html", error="Ingrese una contraseña")

        try:
            # Obtener el usuario desde la base de datos
            usuario = UsuarioModel.get_userbyId(username)

            # Verificar si la consulta devolvió un resultado
            if not usuario or len(usuario) == 0:
                return render_template("login.html", error="Usuario no Existe / Contraseña Incorrecta...")

            # Validar contraseña
            if not check_password_hash(usuario[0][2], password):
                return render_template("login.html", error="Usuario no Existe / Contraseña Incorrecta...")

            # Guardar información en cookies
            response = make_response(redirect('/'))
            response.set_cookie("nameUser", usuario[0][1], max_age=48 * 3600)  # 9 horas
            response.set_cookie("username", username, max_age=48 * 3600)      # 9 horas
            response.set_cookie("user_id", str(usuario[0][0]), max_age=48 * 3600)  # 9 horas

            return response
        except Exception as e:
            return render_template("login.html", error=f"Ocurrió un error inesperado: {str(e)}")
    else:
        return render_template("login.html", error=None)



@app.route("/register", methods=["POST", "GET"])
def register():
    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Ensure username was submitted
        if not request.form.get("username"):
            flash("Ingrese un nombre de usuario")
            return redirect("/register")

        # Ensure password was submitted
        elif not request.form.get("clave"):
            flash("Ingrese una contraseña")
            return redirect("/register")



        data = {
                "nombre_usuario": request.form.get("username"),
                "clave": generate_password_hash(request.form.get("clave")),
                "estadoUsuario":request.form.get("estadoUsuario"),
                "correo": request.form.get("correo")
                }
        
        #envio de datos a la api
        try:
            
            UsuarioModel.add_user(data)

            flash('¡Cuenta creada exitosamente!')
            # Redirect user to login page
            return redirect("/login")

        except Exception as e:
            db.rollback()  # Revertir la transacción en caso de error
            return jsonify({"error": str(e)}), 500

    else:
        return render_template('loginL.html')        


@app.route("/logout")
@login_required
def logout():
    response = make_response(redirect("/login"))
    response.delete_cookie("nameUser")
    response.delete_cookie("username")
    response.delete_cookie("user_id")
    return response

#***************************************************************************************************** PARA LAS VENTAS
@app.route("/GestionVentas")
@login_required
def GestionVentas():
    username = request.cookies.get("username")
    nameuser = request.cookies.get("nameUser")

    clientes = ClienteModel.get_clients()
    ventas_pendientes = VentaModel.get_salesPending()
    actualizar_listaProd()

    return render_template("GestionVentas.html", username=username, clientes=clientes, nameuser=nameuser, pendienteEntregas=ventas_pendientes)


@app.route("/deliverOrder/<int:ventaid>", methods=["POST", "GET"])
@login_required
def deliverOrder(ventaid):
    VentaModel.deliverOrder(ventaid)
    return jsonify({"status": "success", "mensaje": "pedido entregado correctamente."}), 201

@app.route("/saveSale", methods=["POST", "GET"])
@login_required
def saveSale():
    datos = request.json
    usuario_id = request.cookies.get("user_id")
    if not usuario_id:
        return redirect("/login")

    # Define la zona horaria de Nicaragua
    nicaragua_timezone = pytz.timezone('America/Managua')
    nicaragua_time = datetime.now(nicaragua_timezone).strftime('%Y-%m-%d %H:%M:%S.%f')

    cliente_id = datos.get('cliente_id')
    tipo_venta = datos.get('tipo_venta')
    tipo_entrega = datos.get('tipo_entrega')
    productos = datos.get('productos')
    montoPagoInicial = datos.get('montoPagoInicial')
    observacion = datos.get('observacion')

    res = VentaModel.saveSale(cliente_id, usuario_id, tipo_venta, tipo_entrega, productos, montoPagoInicial, observacion, nicaragua_time)
    return jsonify({"status": "success", "mensaje": "Venta registrada correctamente.", "NumFact": res}), 201

@app.route("/deleteSale/<int:id>", methods=["POST"])
@login_required
def deleteSale(id):
    try:
        # Eliminar la venta de la base de datos
        VentaModel.delete_sale(id)
        return jsonify({'success': True, 'message': 'Venta eliminado exitosamente.'})

    except Exception as e:
        return jsonify({'success': False, 'message': 'Error: Ha ocurrido un problema al eliminar la venta. ' + str(e)})

@app.route('/ver_factura/<int:venta_id>/<int:tienePagoIncial>')
@login_required
def ver_factura(venta_id, tienePagoIncial):
    alturaFactura = 100 #altura inicial factura 100mm

    # Obtener la información de la venta y detalles
    venta = VentaModel.get_salesById(venta_id, tienePagoIncial)
    detalles = VentaModel.get_productos_by_sales(venta_id)
     
    total_venta = sum(d['cantidad'] * d['preciounitario'] for d in detalles)


    for d in detalles:
        alturaFactura += 6

    if venta['montoPago'] > 0:
        alturaFactura += 15

    # Renderizamos el template HTML
    html_string = render_template('Factura.html', venta=venta, detalles=detalles, total_venta=total_venta, pagoInicial=venta['montoPago'])

    # Convertir el HTML a PDF
    css = CSS(string="""
              @page { width: 78mm; margin: 0; height:"""+str(alturaFactura)+"""mm; crop: none;}
              body, html { width: 80mm; margin: 2px; padding: 0; height: auto;}
              """)
 
    pdf = HTML(string=html_string).write_pdf(stylesheets=[css])

    # Crear la respuesta con el PDF en línea
    response = make_response(pdf)
    
    #response.headers['Content-Disposition'] = 'inline; filename=Factura_'+str(venta_id)+'.pdf'
    response.headers['Content-Disposition'] = f'attachment; filename=Factura_{venta_id}.pdf'

    response.headers['Content-Type'] = 'application/pdf'

    return response

@app.route('/ver_recibo/<int:cliente_id>/<montoPago>/<tipoPago>')
@login_required
def ver_recibo(cliente_id, montoPago, tipoPago):
    # Define la zona horaria de Nicaragua
    nicaragua_timezone = pytz.timezone('America/Managua')

    # Obtiene la hora actual en la zona horaria de Nicaragua
    nicaragua_time = datetime.now(nicaragua_timezone).strftime('%d-%m-%Y %H:%M:%S')

    Fecha = nicaragua_time
    cliente = ClienteModel.get_clientByID(cliente_id)
    cedula = cliente['cedula']
    nombre = cliente['nombres']+' '+cliente['apellidos']
    referencia=str(uuid.uuid4())[:8]
    if tipoPago == 'total':
        MontoDeuda = 0.00
    else:
        deuda = DeudaModel.get_saleByClient(clienteid=cliente_id)
        if deuda is None:
            MontoDeuda = 0.00
        else:
            MontoDeuda = f"C${deuda:,.2f}"

    # Renderizamos el template HTML
    html_string = render_template('Recibo.html', cedula=cedula, nombre=nombre, fecha=Fecha, montoPago=montoPago, tipoPago=tipoPago, referencia=referencia, deuda=MontoDeuda)

    # Convertir el HTML a PDF
    css = CSS(string="""
              @page { size: 80mm auto; margin: 0; height: 100mm;}
              body, html { width: 80mm; margin: 2px; padding: 0; height: auto;}
              """)  # Ancho de 80mm
    pdf = HTML(string=html_string).write_pdf(stylesheets=[css])

    # Crear la respuesta con el PDF en línea
    response = make_response(pdf)
    
    #response.headers['Content-Disposition'] = 'inline; filename=Factura_'+str(venta_id)+'.pdf'
    response.headers['Content-Disposition'] = f'attachment; filename=Recibo_{cedula}.pdf'

    response.headers['Content-Type'] = 'application/pdf'

    return response

@app.route('/ver_ticketCarga')
@login_required
def ver_ticket_carga():
    alturaTicket = 50 #cantidad inicial de 50mm

    # Define la zona horaria de Nicaragua
    nicaragua_timezone = pytz.timezone('America/Managua')

    # Obtiene la hora actual en la zona horaria de Nicaragua
    nicaragua_time = datetime.now(nicaragua_timezone).strftime('%d-%m-%Y %H:%M:%S')

    Fecha = nicaragua_time
    cantidadProductos = 0
    flag = 0
    productos_json = json.loads(request.args.get('productos'))
    id = uuid.uuid4()

    for p in productos_json:
        cantidadProductos += int(p['cantidad'])
        flag += 1

    alturaTicket += (flag * 6)

    # Renderizamos el template HTML
    html_string = render_template(
        'TicketCarga.html', 
        productos=productos_json, 
        cantidadProductos=cantidadProductos, 
        fechaCarga=Fecha
    )

    # Configura el CSS para el tamaño de 80 mm de ancho
    css = CSS(string="""
        @page { width: 79mm; margin: 0; height: """+str(alturaTicket)+"""mm;} /* 80 mm de ancho y altura auto */
        body, html { margin: 2px; padding: 0;}
    """)

    # Genera el PDF
    pdf = HTML(string=html_string).write_pdf(stylesheets=[css])

    # Crear la respuesta con el PDF en línea
    response = make_response(pdf)
    response.headers['Content-Disposition'] = f'attachment; filename=TicketCarga_{id}.pdf'
    response.headers['Content-Type'] = 'application/pdf'

    return response

#***************************************************************************************************** PARA LOS PRODUCTOS
@app.route("/GestionProductos")
@login_required
def GestionProductos():
    actualizar_listaProd()
    username = request.cookies.get("username")
    nameuser = request.cookies.get("nameUser")
    return render_template("GestionProductos.html", username=username, productos=ProductsList, nameuser=nameuser)

def actualizar_listaProd():
    global ProductsList
    ProductsList=ProductoModel.get_products()

@app.route('/buscar_producto', methods=["GET"])
def buscar_producto():
    query = request.args.get('query', '').lower()
    resultados = [p for p in ProductsList if query in p['nombre'].lower() or query in p['productoid']]
    return jsonify(resultados[:3])

@app.route("/addProduct", methods=["POST"])
@login_required
def addProduct():
    if request.method == "POST":
        nombre = request.form.get("nombreProducto")
        descripcion = request.form.get("descripcionProducto")

        # Validaciones de campos
        if not nombre:
            return jsonify({'success': False, 'message': 'Ingrese un nombre de Producto'}), 400
        
        if not descripcion:
            return jsonify({'success': False, 'message': 'Ingrese una descripción del Producto'}), 400
        
        try:
            # Añadir producto a la base de datos
            p = Producto(productoid=0, nombre=nombre, descripcion=descripcion)
            ProductoModel.add_product(p)

            # Devolver respuesta de éxito
            return jsonify({'success': True, 'message': 'Producto agregado exitosamente'})

        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    
@app.route("/updateProduct", methods=["POST"])
@login_required
def updateProduct():
    if request.method == "POST":
        
        #Obtener datos del formulario
        productid = request.form.get("productid")
        nombre = request.form.get("nombreProducto")
        descripcion = request.form.get("descripcionProducto")

        #Valida Campos
        if not nombre or not descripcion:
            return jsonify({'success': False, 'message': 'Todos los campos son obligatorios'}), 400
        
        try:
            #Editar producto
            p = Producto(productoid=productid,nombre=nombre,descripcion=descripcion)
            ProductoModel.update_product(p)
        except IntegrityError:
            return jsonify({'success': False, 'message': 'Error: La cédula ya está registrada.'})
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)})

        return jsonify({'success': True})
      
@app.route("/deleteProduct/<int:id>", methods=["POST"])
@login_required
def deleteProduct(id):
    try:
        # Eliminar el producto de la base de datos
        ProductoModel.delete_product(id)
        return jsonify({'success': True, 'message': 'Producto eliminado exitosamente.'})

    except Exception as e:
        return jsonify({'success': False, 'message': 'Error: Ha ocurrido un problema al eliminar el Producto. ' + str(e)})

    
#***************************************************************************************************** PARA LOS CLIENTES
@app.route("/GestionCliente")
@login_required
def GestionClientes():
    clientes = ClienteModel.get_clients()
    username = request.cookies.get("username")
    nameuser = request.cookies.get("nameUser")
    return render_template("GestionCliente.html", username=username, clientes=clientes, nameuser=nameuser)

@app.route('/buscar_cliente', methods=["GET"])
@login_required
def buscar_cliente():

    if request.args.get('filtroBusClient') == '1':
        query = request.args.get('query', '').upper()
        resultados = ClienteModel.get_clientById(query)

        if resultados:
            return jsonify(resultados)
        else:
            flash('No se encontro registro del cliente')
            return jsonify({'success': False, 'message': 'No se encontro registro del cliente'}), 400
    elif  request.args.get('filtroBusClient') == '2':
        query = request.args.get('query', '').upper()
        resultados = ClienteModel.get_clientByName(query)
        
        if resultados:
            return jsonify(resultados)
        else:
            flash('No se encontro registro del cliente')
            return jsonify({'success': False, 'message': 'No se encontro registro del cliente'}), 400
    else:
        query = request.args.get('query', '').upper()
        resultados = ClienteModel.get_clientByTelf(query)

        if resultados:
            return jsonify(resultados)
        else:
            flash('No se encontro registro del cliente')
            return jsonify({'success': False, 'message': 'No se encontro registro del cliente'}), 400

@app.route("/addClient", methods=["POST"])
@login_required
def addClient():
    if request.method == "POST":
        nombres = request.form.get("nombreCliente")
        apellidos = request.form.get("apellidoCliente")
        cedula = request.form.get("cedulaCliente")
        telefono = request.form.get("telefonoCliente")
        direccion = request.form.get("direccionCliente")

        # Verifica que todos los campos necesarios están presentes
        if not nombres or not apellidos or not telefono or not cedula or not direccion:
            return jsonify({'success': False, 'message': 'Todos los campos son obligatorios'}), 400

        # Intenta crear un nuevo cliente en la base de datos
        try:
            c = Cliente(clienteid=0, nombres=nombres, apellidos=apellidos, cedula=cedula, telefono=telefono, direccion=direccion, fecharegistro=None)
            ClienteModel.add_client(c)
            return jsonify({'success': True, 'message': 'Cliente agregado exitosamente'}), 200
        except Exception as e:
            # En caso de error, retorna un mensaje indicando el problema
            return jsonify({'success': False, 'message': 'Error: Ha ocurrido un problema / Cédula duplicada'}), 500

    # Redirecciona si el método no es POST
    return redirect("/GestionCliente")

@app.route("/updateClient", methods=["POST"])
@login_required
def updateClient():
    if request.method == "POST":
        # Obtener los datos del formulario
        clienteid = request.form.get("clienteid")
        nombres = request.form.get("nombreCliente")
        apellidos = request.form.get("apellidoCliente")
        telefono = request.form.get("telefonoCliente")
        cedula = request.form.get("cedulaCliente")
        direccion = request.form.get("direccionCliente")

        # Validar campos vacíos
        if not clienteid or not nombres or not apellidos or not telefono or not cedula or not direccion:
            return jsonify({'success': False, 'message': 'Todos los campos son obligatorios'}), 400
        
        try:
            c = Cliente(clienteid=clienteid, nombres=nombres, apellidos=apellidos, telefono=telefono, cedula=cedula, direccion=direccion, fecharegistro=None)
            ClienteModel.update_client(c)

            return jsonify({'success': True, 'message': 'Cliente actualizado exitosamente'})
        
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error al actualizar el cliente: {str(e)}'}), 500


@app.route("/deleteClient/<int:id>", methods=["POST"])
@login_required
def deleteClient(id):
    try:
        # Eliminar el producto de la base de datos
        ClienteModel.delete_client(id)
        return jsonify({'success': True, 'message': 'Cleinte eliminado exitosamente.'})

    except Exception as e:
        return jsonify({'success': False, 'message': 'Error: Ha ocurrido un problema al eliminar el Cliente. ' + str(e)})

#***************************************************************************************************** PARA LOS PAGOS
@app.route("/GestionDeudas")
@login_required
def GestionDeudas():
    username = request.cookies.get("username")
    nameuser = request.cookies.get("nameUser")

    clientes = ClienteModel.get_clients()
    deudas = DeudaModel.get_sales()

    return render_template("GestionDeudas.html", username=username, clientes=clientes, deudas_json=json.dumps(deudas), nameuser=nameuser)

@app.route("/detallesVentas/<int:ventaid>", methods=["GET"])
@login_required
def get_products_by_sale(ventaid):
    try:
        productos = DeudaModel.get_productos_by_sales(ventaid)
        return jsonify({'success': True, 'productos': productos})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
@app.route("/registrarPago", methods=["POST"])
@login_required
def registrar_pago():
    # Obtener los datos de la solicitud
    datos = request.json
    clienteid = datos.get("clienteid")
    montoabono = datos.get("montoabono")

    try:
        # Llamar a la función registrar_pago del modelo
        DeudaModel.registrar_pago(clienteid, montoabono)
        return jsonify({"success": True, "message": "Pago registrado exitosamente"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    
@app.route("/getHistorialPagos/<int:clienteid>", methods=["GET"])
@login_required
def get_historial_pagos(clienteid):
    try:
        historialpagos = DeudaModel.get_pagosby_client(clienteid)
        
        return jsonify({"success": True, "historial": historialpagos})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route("/deletePago/<int:id>", methods=["POST"])
@login_required
def deletePago(id):
    try:
        # Eliminar el producto de la base de datos
        DeudaModel.delete_Pago(id)
        return jsonify({'success': True, 'message': 'Cleinte eliminado exitosamente.'})

    except Exception as e:
        return jsonify({'success': False, 'message': 'Error: Ha ocurrido un problema al eliminar el Cliente. ' + str(e)})

    
#*******************************************************************************************************PARA LOS REPORTES
@app.route("/GestionReportes")
@login_required
def GestionReportes():
    clientes = ClienteModel.get_clients()
    ventas = VentaModel.get_sales()
    username = request.cookies.get("username")
    nameuser = request.cookies.get("nameUser")

    return render_template("Reportes.html", username=username, clientes=clientes, ventas=ventas, nameuser=nameuser)

@app.route("/GestionReportes/Productos", methods=["GET"])
@login_required
def GestionReporteProductos():

    mes = request.args.get('mes')
    anio = request.args.get('anio')
    username = request.cookies.get("username")
    nameuser = request.cookies.get("nameUser")

    if mes and anio:
        try:
            
            topproductos = ProductoModel.get_productsby_monthyear(int(mes), int(anio))
            return jsonify(topproductos)
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500
    else:
        return render_template("ReporteProductos.html", username=username, nameuser=nameuser)

@app.route("/GestionReportes/Carga", methods=["GET"])
@login_required
def GestionReporteCarga():
    fecha_hora_inicio = request.args.get('fecha_hora_inicio')  # Captura la fecha y hora de inicio
    fecha_fin = request.args.get('fecha_fin')  # Captura la fecha de fin (opcional)
    username = request.cookies.get("username")
    nameuser = request.cookies.get("nameUser")

    # Si fecha_fin es una cadena vacía, asigna None
    if not fecha_fin:
        fecha_fin = None

    if fecha_hora_inicio:
        # Llamada al modelo con fecha_hora_inicio y fecha_fin (None si no se proporciona fecha de fin)
        productocarga = ProductoModel.report_carga(fecha_hora_inicio, fecha_fin)
        return jsonify(productocarga)
        
    else:
        # Caso 2: Parámetros insuficientes
        return render_template("ReporteCarga.html", username=username, nameuser=nameuser)

@app.route("/userRegistro", methods=["GET"])
@login_required
def registro():
    return render_template("registro.html")

@app.route("/GestionReportes/Ventas", methods=["GET"])
@login_required
def GestionReporteVenta():
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')
    username = request.cookies.get("username")
    nameuser = request.cookies.get("nameUser")

    if fecha_inicio and fecha_fin:
        ventas_historicas = VentaModel.get_sales_historica(fecha_inicio, fecha_fin)
        return jsonify(ventas_historicas)
    
    elif fecha_inicio and not fecha_fin:
        ventas_historicas = VentaModel.get_sales_historica(fecha_inicio)
        return jsonify(ventas_historicas)
    
    else:
        return render_template("ReporteVentas.html", username=username, nameuser=nameuser)
    
@app.route("/GestionReportes/Deudas")
@login_required
def GestionReportesDeudas():
    deudas = DeudaModel.get_debts_report()
    total_deuda = sum(deuda["montodeuda"] for deuda in deudas)
    username = request.cookies.get("username")
    nameuser = request.cookies.get("nameUser")

    return render_template("ReporteDeudas.html", username=username, deudas=deudas, total_deuda=total_deuda, nameuser=nameuser)

@app.route("/GestionReportes/Utilidades")
@login_required
def GestionReportesUtilidades():
    fecha_hora_inicio = request.args.get('fecha_inicio')  # Captura la fecha y hora de inicio
    fecha_fin = request.args.get('fecha_fin')  # Captura la fecha de fin (opcional)
    username = request.cookies.get("username")
    nameuser = request.cookies.get("nameUser")

    # Si fecha_fin es una cadena vacía, asigna None
    if not fecha_fin:
        fecha_fin = None

    if fecha_hora_inicio:
        # Llamada al modelo con fecha_hora_inicio y fecha_fin (None si no se proporciona fecha de fin)
        productocarga = ProductoModel.report_carga(fecha_hora_inicio, fecha_fin)
        return jsonify(productocarga)
        
    else:
        # Caso 2: Parámetros insuficientes
        return render_template("ReporteUtilidades.html", username=username, nameuser=nameuser)
#*******************************************************************************************************
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)