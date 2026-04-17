## Better Eats

Better Eats es un script de Tampermonkey que mejora la experiencia de Uber Eats en la web.

> **Basado en el trabajo original de [pxue](https://github.com/pxue/better-eats).  
> Lo único que hice fue traducir y adaptar los filtros de ofertas al español (Chile).**

<img width="1918" height="987" alt="image" src="https://github.com/user-attachments/assets/8c560055-8f53-444a-a899-0cdaa212089c" />

### Instalación:
1. Instala [Tampermonkey](https://tampermonkey.net/)
2. Ve a [este archivo](https://github.com/estardacs/better-eats/blob/main/script.user.js), haz clic en el botón "Raw" en la esquina superior derecha.
3. Tampermonkey debería abrirse automáticamente para la instalación.

### Funcionalidades:

- Funciona en Chile (`/feed?diningMode=DELIVERY`)
- Filtrar solo 2X1
- Filtrar por "Gasta y ahorra"
- Filtrar por restaurantes con ofertas disponibles
- Lista negra (ej. ocultar todos los McDonald's)
- Filtro por tiempo de entrega máximo (en minutos)
- Auto-carga: hace clic automático en "Mostrar más" hasta cargar todos los resultados
- **Cache de ofertas entre feeds**: guarda los restaurantes con ofertas vistos en cualquier feed y muestra en el panel cuales tienen 2X1 pero no aparecen en el feed actual

### Mejoras de UI:

- Grilla actualizada a 5 elementos por fila
- Panel flotante (abajo a la izquierda) con estadísticas en tiempo real
- Barra de estado que indica si el feed fue detectado
- Log interno para depuración

### Cache entre feeds

Uber Eats tiene dos feeds distintos: el feed principal y el de Ofertas. Cada uno muestra algunas 2X1 exclusivas que el otro no tiene.

El script guarda automáticamente los restaurantes con ofertas en `betterEats_cache` (localStorage, TTL 6 horas). Cuando cambias de feed, el panel muestra la sección **"También con ofertas"** listando los locales vistos en el otro feed con link directo a cada uno.

Flujo recomendado:
1. Entra al feed principal y deja que cargue todo (botón "Cargar todo")
2. Navega al feed de Ofertas — el panel mostrará los restaurantes del feed principal que no aparecen aquí

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
