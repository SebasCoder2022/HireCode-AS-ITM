# Supuestos declarados

El enunciado del reto deja tres puntos abiertos a propósito. Esto es lo
que asumimos sobre cada uno y por qué.

## 1. Alcance de "deshacer"

RRHH insinuó que podría ir más allá de la última transición. Asumimos que
eso significa **deshacer iterativo sobre un historial completo por
candidato** (una pila LIFO), no un mecanismo de "rehacer" hacia adelante.

`GestorCandidato` guarda `Comando[]` por `candidato.id`. Cada llamada a
`deshacerUltimoCambio(candidato)` saca el comando más reciente del tope y
lo deshace — así que invocarlo N veces seguidas retrocede N pasos, hasta
agotar el historial (el smoke test en `main.ts` lo hace dos veces
seguidas para probarlo). No implementamos "rehacer" (volver a aplicar un
comando ya deshecho) porque el enunciado no lo pide y no hay una señal de
negocio concreta que lo justifique todavía — agregarlo después es
sencillo (una segunda pila de comandos deshechos) sin tocar el resto del
diseño, precisamente porque `Comando` ya expone `ejecutar()`/`deshacer()`
simétricos.

## 2. Reglas de notificación al gerente de contratación

El enunciado las deja deliberadamente vagas: "cuando ya hay algo concreto
que decidir". Interpretamos eso como los puntos donde gerencia debe
**decidir algo o enterarse de una decisión ya tomada**, no cada paso
operativo interno de RRHH:

- `OFERTA` — hay una oferta sobre la mesa; gerencia tiene algo que decidir.
- `CONTRATADO` — la decisión ya se tomó; gerencia debe saberlo.
- `RECHAZADO` — idem, para el desenlace negativo.

`APLICADO`, `ENTREVISTA` y `PRUEBA_TECNICA` no notifican: son trámite
interno de RRHH, no hay nada que gerencia deba decidir todavía. Esta
regla no está hardcodeada en `NotificadorGerencia` como una lista de
nombres — vive como un dato (`esPuntoDeDecision: boolean`) en cada
`Etapa`, así que ajustar en qué etapa se notifica es cambiar un valor al
construir esa `Etapa` en `main.ts`, no tocar `NotificadorGerencia`.

## 3. El proceso todavía se está definiendo (etapas futuras)

El enunciado dice explícitamente que van a llegar más etapas y que no
todas se conocen hoy. Por eso no modelamos las etapas como una
enumeración cerrada en el dominio (como sí se hizo, deliberadamente más
simple, en la versión Java previa de este reto): `Etapa` es una clase de
datos y `FlujoSeleccion` recibe el orden de etapas como un arreglo
externo, construido en `main.ts` (la raíz de composición).

Agregar una etapa futura es insertar un elemento en ese arreglo — ninguna
clase de `dominio`, `aplicacion` ni `infraestructura` cambia. No fuimos
más allá de esto (por ejemplo, no agregamos carga del flujo desde un
archivo de configuración o una base de datos): para un MVP, el arreglo en
código ya resuelve la extensibilidad que pide el enunciado, y una capa de
configuración externa sin un caso de uso concreto que la necesite hoy
sería sobreingeniería. Si en el futuro el flujo necesita cambiar sin
recompilar, esa carga se agrega como un adaptador nuevo en
`infraestructura` que construya el mismo arreglo de `Etapa` — el resto
del diseño no se entera.

## Nota sobre encapsulamiento

TypeScript no tiene un equivalente exacto al `package-private` de Java.
`Candidato.avanzarA(...)` es técnicamente público; la protección real es
que `ComandoAvanzar` y `ComandoRechazar` —los únicos que deberían
invocarlo— están en el mismo archivo que `Candidato` y no se exportan, así
que ningún otro archivo del proyecto puede construirlos directamente. Se
declara así en vez de simularse con un mecanismo más elaborado (como un
token de capacidad) para no meter una pieza de diseño adicional que el
alcance del reto no pide.
