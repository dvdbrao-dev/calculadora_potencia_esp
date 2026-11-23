# Revisión de potencia eléctrica de vivienda — Mejoradora Granada (v2)

Aplicación estática independiente de https://mejoradoragranada.es, desplegada en Vercel mediante GitHub. **No realiza cambios de contrato ni prescribe potencias.**

## Qué hace

### Modo 1 · Orientación cualitativa
Recibe información de cocina, ACS, climatización, vehículo eléctrico y bombas. Enumera riesgos, hábitos y comprobaciones, pero **NO calcula ni recomienda potencia en kW**: sumar consumos nominales sin conocer su coincidencia y demanda medida induce a error.

### Modo 2 · Análisis de máximas demandas (2.0TD)
- Introducción manual de potencias contratadas **P1 y P2 independientes**, de 0,1 a 15 kW.
- Captura por meses cerrados de los **máximos de potencia demandada, en kW**, para cada uno de los dos periodos de potencia, idealmente procedentes de la distribuidora; **no** sirven kWh/mes ni potencias nominales.
- Para comparar contra los máximos anuales se necesitan **12 meses completos**. Si faltan, muestra cobertura incompleta e impide comparar el escenario con el año.
- El cliente puede escribir un **escenario hipotético P1/P2**, que no es generado automáticamente ni es recomendación de contratación.
- El escenario se clasifica como: superioridad de uno o varios máximos observados sobre la potencia simulada; distancia inferior a 0,3 kW en algún periodo (alerta indicativa **no reglamentaria**); o ningún máximo superior en el historial introducido (sin garantía futura).
- Se pregunta por cortes del ICP y cambios recientes de equipos/hábitos.
- Comparación del término fijo anual a precios **aportados por la persona usuaria**, expresados en €/kW/día (×365) o €/kW/año. Calcula el coste actual y simulado. **No** incluye impuestos, derechos de cambio, renovaciones o condiciones variables.

## Limitaciones esenciales

1. **Las mediciones son introducidas manualmente y no verificadas** con datos de la distribuidora. El sistema no identifica datos inventados, errores de transcripción, meses omitidos ni si son picos adecuados para el control de potencia. La etiqueta «12/12» solo significa «12 filas cumplimentadas y numéricamente válidas».
2. Máximos registrados no equivalen a garantía de que una potencia no cause cortes; influyen la duración de los picos, tipo y tolerancia de limitador, cargas futuras y contexto de instalación.
3. La diferencia de 0,3 kW usada como aviso de cercanía al máximo es **criterio de interfaz/cribado**, no norma ni margen profesional calibrado.
4. La evaluación NO optimiza por curvas cuarto-horarias ni calcula probabilidades, percentiles, demanda simultánea real, ni coste de sobrepasar potencia.
5. El resultado **nunca** autoriza directamente una bajada ni subida. Un asesor debe comprobar perfil medido, histórico, suministros con modificaciones y coste completo.
6. Solo 2.0TD; no aplicar a 3.0TD/6.xTD.
7. El envío por WhatsApp solo ocurre cuando el usuario pulsa el enlace y confirma el mensaje en su dispositivo.

## Comprobaciones

Sin dependencias de producción. Node 20+:
- Sintaxis: node --check calculator.mjs && node --check app.mjs
- Tests: node --test tests/*.test.mjs
- Servidor local: python -m http.server 8080 y abrir http://localhost:8080

GitHub Actions ejecuta las comprobaciones en cada pull request y cambios a main. Vercel recibe los despliegues mediante integración GitHub.

## Fuentes de metodología (contexto, no aval del motor)

- CNMC, [Comercialización y suministro eléctrico](https://www.cnmc.es/facil-para-ti/que-hace-la-cnmc-para-consumidores/comercializacion-y-suministro-electrico): potencia contratada y máxima demanda disponibles en distribuidora.
- CNMC, [La nueva factura de la luz](https://blog.cnmc.es/2021/05/31/nueva-factura-de-la-luz/): diferencia P1 y P2, horarios punta y valle, fines de semana y carga VE.
- BOE, [Circular 3/2020 consolidada](https://www.boe.es/buscar/act.php?id=BOE-A-2020-1066), modificada, entre otras, por Circular 1/2025: peaje 2.0TD para potencias contratadas de hasta 15 kW por periodo.

## Privacidad y estilo

El cálculo se realiza en el navegador, sin guardar ni enviar valores a ningún servidor de Mejoradora. La carga del logotipo y de las fuentes utiliza sitios externos. Se mantienen logotipo, colores y tipografías de Mejoradora Granada. El botón WhatsApp abre una URL externa con el texto elegido por el visitante.
