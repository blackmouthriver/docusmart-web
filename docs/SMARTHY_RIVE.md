# Smarthy en Rive — guía y contrato (W-153)

Smarthy reemplaza el ícono de chat del botón flotante del asistente (web y, más adelante, la app Android).
Un solo archivo `smarthy.riv` sirve para las dos. Esta guía dice **qué hacer en Rive** y **qué nombres exactos**
espera el código: si un nombre cambia, la animación no responde (el código no falla: muestra el PNG quieto).

## 1. Preparar las imágenes (Photopea, gratis en photopea.com)

1. Abrir cada pose, quitar el fondo (Seleccionar → Quitar fondo) y dejarla en un lienzo **1024×1024**
   transparente, con Smarthy **centrado y al mismo tamaño en todas** (que los pies queden a la misma altura).
2. Tomar la pose de reposo (Idle) y **separarla en capas**, cada una en su PNG transparente del mismo tamaño
   (1024×1024, sin recortar, así quedan alineadas al importarlas):
   - `cuerpo`, `cabeza`, `brazo_izq`, `brazo_der`, `gafas` (u ojos), `luces` (líneas que brillan)
   - `parpados` (los ojos cerrados, para parpadear)
   - bocas: `boca_0` cerrada, `boca_1` entreabierta, `boca_2` abierta, `boca_3` en «O»
   - Al recortar un brazo, rellenar con el pincel de clonar el hueco que deja en el cuerpo.
3. Lo que no exista (párpados, bocas), pedírselo a la misma IA que hizo las poses: «la misma imagen, misma luz y
   textura, con la boca abierta». Recortar solo la boca.
4. Exportar en PNG. Que cada capa pese menos de ~150 KB (el archivo final debería quedar por debajo de 400 KB;
   ideal, 200 KB). Si pesa mucho, bajar las capas a 768×768.

## 2. Armar en Rive (rive.app, plan gratis)

- **Artboard:** nombre `Smarthy`, tamaño **512×512**, fondo transparente. Dejar ~10 % de margen alrededor:
  el saludo y la celebración no deben salirse del cuadro.
- Importar los PNG y armar la jerarquía con huesos o grupos (cabeza dentro del cuerpo, gafas y bocas dentro de la
  cabeza) para que todo se mueva junto al flotar.
- **Animaciones** (timelines; los nombres son libres, estos son sugeridos):

| Animación | Duración | Bucle | Qué hace |
|---|---|---|---|
| `idle` | 3 s | sí | flota suave arriba y abajo, parpadea una vez, las luces laten |
| `saludo` | 1,2 s | no | levanta el brazo y saluda |
| `procesando` | 2 s | sí | escanea / las luces corren (mientras una herramienta trabaja) |
| `exito` | 1,8 s | no | celebra |
| `error` | 2,5 s | no | «oops», se encoge un poco |
| `hablar` | — | — | no es un timeline: lo maneja el input `boca` (ver abajo) |

- **Máquina de estados:** nombre `Smarthy`. **Inputs (nombres exactos, en minúsculas y sin tildes):**

| Input | Tipo | El código lo usa así |
|---|---|---|
| `saludo` | Trigger | al pasar el mouse o al abrir el chat por primera vez |
| `procesando` | Boolean | `true` mientras una herramienta procesa; `false` al terminar |
| `exito` | Trigger | al terminar bien una herramienta |
| `error` | Trigger | junto al aviso de error |
| `hablando` | Boolean | `true` mientras el asistente lee su respuesta en voz alta |
| `boca` | Number (0–3) | cambia en cada palabra/sílaba: 0 cerrada, 1 entreabierta, 2 abierta, 3 «O» |

- **Transiciones:** desde cualquier estado, `saludo`/`exito`/`error` reproducen su animación una vez y vuelven
  a `idle` («Exit time» 100 %). `procesando = true` pasa a `procesando` en bucle y vuelve a `idle` con `false`.
- **Boca:** una capa (layer) aparte de la máquina de estados que muestra `boca_0…3` según el valor de `boca`
  (condiciones `boca == 0`, `== 1`…), para que pueda hablar mientras flota o procesa.
- Probar todo en el panel de reproducción de Rive cambiando los inputs a mano.

## 3. Exportar y entregar

- Exportar → **Download → `.riv`** (runtime más reciente). Nombre: `smarthy.riv`.
- Exportar además **un PNG quieto** de la pose de reposo, 256×256: `smarthy.png` (se ve mientras carga y con
  «reducir movimiento»).
- Ponerlos en `assets-src/smarthy/` del proyecto (o pasármelos) y yo hago el resto.

## 4. Lo que hace el código (🤖, cuando llegue el archivo)

- Motor `@rive-app/canvas-lite` con su `.wasm` servido desde `public/` (la CSP no permite su CDN; `wasm-unsafe-eval`
  ya está permitido). Se descarga cuando el navegador está libre, nunca antes de pintar la página.
- El botón conserva su tamaño (58 px), el clic que abre el panel, el foco de teclado y el texto accesible.
- Con «reducir movimiento», sin WebGL/canvas o si falla la carga: el PNG quieto.
- Voz: `speechSynthesis` **solo con voces del dispositivo** (`localService === true`), apagada por defecto, con
  botón de silencio; si no hay voz local, Smarthy se anima pero no habla (las voces en línea mandarían el texto
  a un servidor y romperían la promesa de privacidad).
- Pausar la animación cuando la pestaña está oculta o el botón no se ve (ahorro de batería).
