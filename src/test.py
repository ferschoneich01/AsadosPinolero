# Vamos a abrir el archivo y revisar su contenido para detectar el posible error de sintaxis.
file_path = './static/js/GestionVentas.js'

with open(file_path, 'r', encoding='utf-8') as file:
    js_content = file.readlines()

# Mostramos las primeras líneas para buscar el posible error
js_content[:20]

print(js_content)
