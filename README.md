## Better Eats

Better Eats es un script de Tampermonkey que mejora la experiencia de Uber Eats en la web.

> **Basado en el trabajo original de [pxue](https://github.com/pxue/better-eats).  
> Lo único que hice fue traducir y adaptar los filtros de ofertas al español (Chile).**

![Screenshot 2024-08-16 at 7 10 06 PM](https://github.com/user-attachments/assets/fb4193d1-1f82-4fe2-9eb6-aae6514fa74d)

### Instalación:
1. Instala [Tampermonkey](https://tampermonkey.net/)
2. Ve a [este archivo](https://github.com/estardacs/better-eats/blob/main/script.user.js), haz clic en el botón "Raw" en la esquina superior derecha.
3. Tampermonkey debería abrirse automáticamente para la instalación.
4. **Debe usarse en la página pre-filtrada de "Ofertas"**

### Funcionalidades:

- Funciona en Chile (`/cl/feed`)
- Mostrar solo ofertas 2X1
- Filtrar por "Gasta y ahorra"
- Filtrar por restaurantes con ofertas disponibles
- Lista negra (ej. ocultar todos los McDonald's)

### Mejoras de UI:

- Grilla actualizada a 5 elementos por fila

... más funcionalidades próximamente ...

### Lista de exclusión

El valor de la lista de exclusión se guarda en el almacenamiento local como un array JSON. Puedes actualizarlo mediante la interfaz o directamente en el storage.

### Cómo desarrollar

Puedes editar la extensión directamente desde el dashboard de Tampermonkey o cargar el archivo `script.user.js`.

Para cargar el archivo del script, crea un nuevo script con solo el siguiente encabezado:

```
// ==UserScript==
// @name         Better Eats
// @namespace    https://ubereats.com/
// @grant        none
// @require      file://<ruta al script.user.js>
// ==/UserScript==
```

Luego, habilita el acceso a archivos locales desde https://www.tampermonkey.net/faq.php?locale=en#Q204
