# 📚 TAREA CERO — Organización Escolar para Estudiantes

¡Bienvenido a **TAREA CERO**! Una aplicación web progresiva y ligera diseñada específicamente para ayudar a estudiantes de bachillerato a organizar, priorizar y controlar sus tareas escolares de forma rápida, visual e inteligente.

---

## 🔗 Enlaces del Proyecto

* 🌐 **URL de la App Publicada:** [https://20003631-create.github.io/tarea-cero](https://tu-usuario.github.io/tarea-cero) *(Reemplaza con tu enlace de GitHub Pages, Vercel o Netlify)*
* 📂 **Repositorio en GitHub:** [https://github.com/20003631-create/tarea-cero](https://github.com/tu-usuario/tarea-cero)
* 📱 **Código QR de acceso rápido:** Disponible en `Evidencias/Tareacero.png`

---

## 🎯 Ejercicio Asignado

* **Ejercicio N.º:** 9
* **Nombre de la App:** TAREA CERO
* **Categoría:** Educación
* **Usuario Objetivo:** Estudiante de bachillerato

---

## 🚀 Funcionalidades Principales

1. **Gestión de Tareas (P0 & M1):**
   * Crear, editar, listar y eliminar tareas escolares.
   * Asignar materia, fecha de entrega y nivel de prioridad (Alta, Media, Baja).
   * Filtrar por estado (Completada / Pendiente) y por materia.
2. **Persistencia Local (M2):**
   * Guardado automático de datos usando `localStorage` para no perder la información al cerrar o recargar la página.
   * Opción de exportar e importar copias de respaldo en formato JSON.
3. **Diseño Móvil y Accesibilidad (M3):**
   * Interfaz *Mobile-First* adaptada para pantallas desde 320px de ancho y fácil uso con una sola mano.
   * Alto contraste y tipografía legible de mínimo 16px.
   * Mensajes de estado vacío motivadores cuando no hay tareas pendientes.
4. **Validaciones y Resistencia a Errores (M4):**
   * Control de campos obligatorios, fechas pasadas y longitud máxima de texto.
   * Prevención de duplicados o clics repetidos.
5. **Estrategia Inteligente de Estudio con IA (M5):**
   * Integración con **Google AI Studio (Gemini 1.5 Flash)** para analizar la lista de tareas pendientes.
   * Generación de una estrategia de estudio estructurada en formato JSON indicando qué tarea priorizar, la razón y un plan sugerido paso a paso.
   * Sistema de respuesta alternativa (*fallback*) en JSON local para garantizar el funcionamiento sin conexión a internet.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5:** Estructura semántica de la aplicación.
* **CSS3:** Estilos responsivos, variables CSS y diseño adaptable.
* **JavaScript (ES6+):** Lógica del cliente, manejo del DOM y peticiones asíncronas (`fetch`).
* **Google AI Studio (Gemini API):** Generación de respuestas estructuradas en JSON para el módulo inteligente.
* **Git & GitHub:** Control de versiones y publicación a través de GitHub Pages.

---

## 🛡️ Declaración del Uso de IA y Tarjeta Anti-Alucinación

### Declaración de Uso de Inteligencia Artificial
Para el desarrollo de esta aplicación se utilizó **Google AI Studio (Gemini)** como asistente de código a través de una metodología iterativa basada en 6 peldaños (P0 a M5). Todo el código generado por la IA fue revisado, probado, integrado y validado manualmente por el desarrollador para asegurar su correcto funcionamiento, usabilidad y cumplimiento de los criterios de aceptación.

### Tarjeta Anti-Alucinación (Anti-Hallucination Card)
* **¿Qué datos generó la IA que requirieron verificación?**
  * Estructura inicial del JSON devuelto por la API de Gemini para la sugerencia de estudio.
  * Funciones de manipulación de fechas en JavaScript para evitar tareas en días pasados.
* **¿Qué riesgos potenciales se identificaron?**
  * La IA podría devolver un formato JSON malformado o no válido en la llamada a la API.
  * La API Key de la IA podría quedar expuesta públicamente si no se maneja de forma segura o condicional.
* **¿Cómo se mitigaron estos riesgos?**
  * Se implementó un bloque `try/catch` riguroso al parsear la respuesta JSON de la API.
  * Se incluyó un objeto JSON local estático (*fallback*) que la app utiliza automáticamente si la API no responde, genera error o no tiene conexión a internet.
  * Se configuró el envío de la API Key mediante campo de entrada en la interfaz o variable de entorno para evitar dejar la clave incrustada en el código público.

---

## 🧪 Tabla de Pruebas de Resistencia (Peldaño M4)

| ID | Intento de Entrada / Acción Mala | Comportamiento Esperado | Resultado en la App | ¿Aprobado? |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Enviar formulario de tarea completamente vacío. | Mostrar mensaje de alerta señalando que la materia y el título son requeridos. | Alerta visual activada, no se crea la tarea. | ✅ Sí |
| 2 | Ingresar una fecha de entrega anterior a la fecha actual. | Impedir el guardado y solicitar una fecha válida (hoy o futura). | Campo resaltado en rojo con mensaje "Fecha no válida". | ✅ Sí |
| 3 | Escribir un título de tarea con más de 250 caracteres. | Cortar automáticamente el texto o mostrar error de longitud. | Bloqueo de entrada a 100 caracteres máximo. | ✅ Sí |
| 4 | Hacer doble clic rápido en el botón "Agregar Tarea". | Evitar la duplicación de tareas en la lista. | Botón se deshabilita temporalmente al hacer clic. | ✅ Sí |
| 5 | Borrar datos de `localStorage` manualmente desde las herramientas del navegador. | La app no debe colgarse ni mostrar pantalla blanca. | La app detecta la falta de datos y muestra el estado vacío por defecto. | ✅ Sí |

---

## 👥 Tabla de Pruebas con Usuarios Reales

*Se realizó una prueba rápida de usabilidad sin explicaciones previas a 3 personas del perfil objetivo:*

| Nombre | Perfil | Comentario u Observación durante la Prueba | Ajuste o Mejo Realizada |
| :--- | :--- | :--- | :--- |
| **Carlos M.** | Estudiante de Bachillerato | "Me costó encontrar dónde marcar la tarea como lista en la pantalla del celular." | Se aumentó el tamaño del checkbox a 24px para facilitar el toque táctil. |
| **Sofía R.** | Estudiante de Bachillerato | "Estaría genial ver cuántas tareas me faltan en total arriba." | Se agregó un contador en la cabecera: *"X tareas pendientes"*. |
| **Diego G.** | Estudiante de Bachillerato | "El botón de pedir recomendación con IA tardaba un poco y pensaba que no funcionaba." | Se añadió un indicador visual de carga ("Cargando estrategia..."). |

---

## 📁 Estructura del Repositorio

```text
tarea-cero/
├── index.html              # Código principal (HTML, CSS y JS)
├── README.md               # Documentación general del proyecto
├── PROMPTS.md              # Bitácora de los 6 prompts utilizados en la IA
└── evidencias/             # Capturas de pantalla requeridas
    ├── E0-inicial.png
    ├── E1-antes.png
    ├── E1-despues.png
    ├── E2-antes.png
    ├── E2-despues.png
    ├── E3-celular.png
    ├── E3-vacio.png
    ├── E4-error.png
    ├── E5-json.png
    ├── E5-app.png
    ├── E5-falla.png
    └── qr.png
