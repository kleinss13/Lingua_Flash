# Lingua — PWA de tarjetas para aprender idiomas

Aplicación ligera para alemán A1, con inicio de cuatro opciones (Test, Errores, Añadir y Palabras), diseño naranja/blanco/negro, tarjetas, importación Excel y exportación de vocabulario actualizado. Hecha con HTML, CSS y JavaScript vanilla. Las tarjetas y el tema se guardan en `localStorage`; el Service Worker almacena los archivos de la interfaz para abrirla sin conexión después de la primera visita.

## Archivos

- `index.html`: estructura, navegación y metadatos de instalación.
- `style.css`: interfaz responsive, tema claro/oscuro y animaciones.
- `script.js`: tarjetas, quiz, repaso de errores, estadísticas e importación/exportación.
- `manifest.json`: nombre, modo standalone e iconos de la PWA.
- `sw.js`: caché de recursos para funcionamiento offline.
- `vocabulario_aleman_A1_lingua.xlsx`: vocabulario inicial español/alemán.
- `icons/icon-192.png` y `icons/icon-512.png`: iconos de instalación.

## Publicar en GitHub Pages

1. Entra en [GitHub](https://github.com/) e inicia sesión.
2. Pulsa **New repository**. Ponle un nombre, por ejemplo `lingua-flash-pwa`, y crea el repositorio. Puede ser público.
3. Sube todos los archivos y la carpeta `icons/`, manteniendo exactamente esta estructura. Puedes usar **Add file → Upload files** o Git.
4. En el repositorio, abre **Settings → Pages**.
5. En **Build and deployment**, selecciona **Deploy from a branch**.
6. Selecciona la rama `main` y la carpeta `/(root)`, y pulsa **Save**.
7. Espera a que GitHub Pages publique el sitio. La URL será parecida a `https://TU-USUARIO.github.io/lingua-flash-pwa/`. Si el repositorio se llama `TU-USUARIO.github.io`, la URL no llevará el nombre del repositorio.
8. Abre la URL publicada por HTTPS y comprueba que carga la aplicación.

## Instalar en iPhone

1. Abre la URL publicada en **Safari** (no en una pestaña integrada de otra app).
2. Pulsa **Compartir**.
3. Selecciona **Añadir a pantalla de inicio**.
4. Si aparece, activa **Abrir como app web** y pulsa **Añadir**.

iOS utiliza `apple-touch-icon` para el icono de la pantalla de inicio y los metadatos `apple-mobile-web-app-*` para el modo web app. El soporte de instalación y algunas funciones de PWA dependen de la versión de iOS; el Service Worker necesita HTTPS, que GitHub Pages proporciona.

## Datos y copias de seguridad

- Los datos permanecen en el almacenamiento local del navegador de ese dispositivo. No se sincronizan automáticamente entre dispositivos.
- Usa el botón de exportar para descargar una copia JSON.
- Al importar, confirma si quieres reemplazar las tarjetas existentes o añadir las nuevas.
- Borrar los datos del sitio o el almacenamiento del navegador puede eliminar las tarjetas. Guarda exportaciones periódicas.

## Desarrollo local

El Service Worker no funciona al abrir `index.html` directamente con `file://`. Usa un servidor local, por ejemplo la extensión **Live Server** de VS Code o `python -m http.server 8000`, y visita `http://localhost:8000`. Para que el navegador permita instalar la PWA en producción, publica mediante HTTPS.

## Nota

La validación ignora mayúsculas, tildes y algunos signos de puntuación. No hace traducción automática ni sincronización en la nube: el vocabulario lo introduce el usuario.


## Excel: importar y actualizar

- En **Añadir**, pulsa **Cargar Excel** para leer el Excel que está publicado junto a `index.html`, o **Elegir archivo** para seleccionar uno desde tu dispositivo.
- Las palabras importadas y añadidas se guardan en el almacenamiento local de ese navegador. Los errores se conservan entre visitas en el mismo dispositivo.
- En **Añadir**, pulsa **Descargar Excel actualizado** para exportar todas las tarjetas en un nuevo `.xlsx`. Después, sube ese archivo a GitHub si quieres que la versión publicada contenga también las palabras nuevas. GitHub Pages es estático: la app no puede escribir directamente sobre el Excel que ya está publicado.


## Alemán e inglés
La app permite cambiar entre DE · A1 (naranja) y EN · A1 (azul) desde el botón superior. Cada idioma guarda tarjetas y errores por separado. Mantén ambos Excel en la raíz del repositorio: `vocabulario_aleman_A1_lingua.xlsx` y `vocabulario_ingles_A1_lingua.xlsx`.
