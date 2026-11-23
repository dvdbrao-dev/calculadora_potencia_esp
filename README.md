# Calculadora de potencia eléctrica de vivienda — Mejoradora Granada

Recreación de la calculadora que estuvo publicada en StaticRun, utilizando los campos visibles del proyecto original. Diseño coordinado con https://mejoradoragranada.es.

## Archivos

- index.html: aplicación y contenidos.
- styles.css: estilos responsive con Figtree/Fraunces, turquesa #007887, dorado #e1b45a.
- calculator.mjs: función pura de simulación de potencia.
- app.mjs: lectura del formulario, resultado y enlace opcional a WhatsApp.
- tests/calculator.test.mjs: pruebas automáticas del motor.

## Ejecutar y comprobar

Sin dependencias npm. Requiere Node.js 20+ para ejecutar pruebas.

Pruebas: node --test tests/calculator.test.mjs

Servidor local: python -m http.server 8080

Abrir: http://localhost:8080/

## Fórmula orientativa

La simulación estima consumo base (frigorífico, luces y pequeños usos), cocina, ACS, climatización, electrodomésticos seleccionados, motores y carga de vehículo eléctrico. Aplica hipótesis de simultaneidad habitual/intensa y 10 % de margen. El resultado valle nunca es inferior al pico punta, por la clasificación de los fines de semana y festivos nacionales como valle en 2.0TD.

La previsión de carga del REBT/ITC-BT-10 para diseñar la instalación no es igual a la potencia de contratación. La herramienta NO sustituye la revisión de máximas demandas, incidencias, instalación y hábitos; no garantiza ahorrar ni evitar disparos. Cargadores con gestión dinámica de carga requieren un análisis específico.

La diferencia económica (opcional) se obtiene con los precios de potencia introducidos por el usuario:
365 × ((P1 actual − P1 estimada) × precio P1 + (P2 actual − P2 estimada) × precio P2).

El cálculo excluye impuestos, derechos de cambio y otras condiciones. No utiliza precios de Internet.

## Despliegue

Sitio estático de Vercel (framework Other), conectado a la rama main de este repositorio. No requiere variables de entorno ni backend.

## Marca y datos

Logotipo: https://mejoradoragranada.es/logo-mejoradora-granada.png. Tipografías y paleta obtenidas del repositorio de la web corporativa. CTA 613 685 560; enlaces legales a mejoradoragranada.es.

Todos los datos permanecen en el navegador. Solo al pulsar WhatsApp se abre un mensaje prellenado, que el usuario decide enviar.
