# Stopbullyn

Web estática para presentar la colección de Sergio. HTML, CSS y JavaScript sin framework ni proceso de compilación. Español e inglés, claro y oscuro, catálogo filtrable, visor frontal/espalda, enlaces directos a diseños y efectos de profundidad con respeto a movimiento reducido.

URL prevista: https://ismael-sarmiento.github.io/stopbullyn/

## Abrir y validar

```sh
python3 -m http.server 4187 --bind 127.0.0.1
python3 tools/check_site.py
node --check assets/app.js
node --check assets/catalog.js
node --check assets/i18n.js
```

Visita `http://127.0.0.1:4187/`. No se necesita instalar paquetes. Las fuentes e iconos están incluidos localmente. El catálogo usa las 17 láminas JPG originales, sin alterar sus estampados. Las vistas frontal y espalda se presentan con CSS. La prenda de portada y el emblema son recursos visuales generados a partir de las referencias; el visor permite consultar siempre el original.

## GitHub Pages

Publicar `index.html`, `.nojekyll` y la carpeta `assets/` en la rama `main` del repositorio `ismael-sarmiento/stopbullyn`. En Settings → Pages, elegir Deploy from a branch → main → / (root). Las rutas son relativas para funcionar en `/stopbullyn/`. Los archivos de evidencia y herramientas de validación se conservan localmente, fuera de la entrega pública si se carga solo ese conjunto.

## Contenido

- `assets/catalog.js`: diseños, categorías, lado del frontal y descripciones ES/EN.
- `assets/i18n.js`: textos de interfaz ES/EN; ambos diccionarios deben tener las mismas claves.
- `assets/styles.css`: variables de ambos temas, disposición móvil y animaciones.
- `assets/app.js`: filtros, visor accesible nativo `dialog`, idioma, tema, enlaces de diseño y compartir.
- Preferencias: claves locales `stopbullyn-theme` y `stopbullyn-language`.
- URL inglesa: `?lang=en`. URL de prenda: `#design-lion-tee` (o el identificador del catálogo).

Por ahora es una presentación de la colección: no acepta pedidos o pagos ni inventa precios, existencias, tallas, materiales, contactos o redes. Los textos de las propias prendas conservan su idioma original. El nombre en la web es Stopbullyn, según el encargo; los estampados muestran Stop Bullying.

## Recursos de terceros

Barlow Condensed y DM Sans de Google Fonts, con licencias SIL OFL en `assets/fonts/`. Iconos oficiales Bootstrap Icons v1.13.1, con licencia MIT en `assets/icons/LICENSE`. Los originales de prendas se proporcionaron por el usuario. No se concede una licencia nueva sobre esas ilustraciones.

## Publicación y evidencia

Consultar `design-qa.md` y `evidence/` en el proyecto local para los resultados comprobados. El cierre de publicación se registra en `session-memory.md` local. La publicación se hace con la interfaz de GitHub en Chrome, conforme a la configuración de esta máquina.
