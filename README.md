# HireCore — refactor en TypeScript, arquitectura por capas

Refactor del método `avanzarEstado` original (una cadena de `if/else` sobre
strings, con `EmailService` invocado directamente desde el orquestador) en
un MVP en TypeScript, sin framework, organizado en capas
(dominio / aplicación / infraestructura). Ver `SUPUESTOS.md` para las
decisiones tomadas frente a lo que el enunciado deja abierto.

## Patrones aplicados

| Requisito                    | Patrón              | Dónde                                              |
|-------------------------------|----------------------|-----------------------------------------------------|
| Etapas del proceso            | State (variante orientada a datos) | `Etapa` + `FlujoSeleccion`            |
| Notificaciones a gerencia     | Observer + Strategy  | `PublicadorEventos`/`ObservadorEventos` + `CanalNotificacion` |
| Deshacer cambios (multi-nivel)| Command + Factory Method | `Comando` + `FabricaComandos`                    |

`GestorCandidato` no conoce nombres concretos de etapas (verificable: no
hay ningún literal `"APLICADO"`, `"OFERTA"`, etc. en su archivo), no conoce
destinatarios de notificación, y no conoce la mecánica de deshacer: delega
las tres cosas en los patrones anteriores. Esto es lo que pedía el reto
explícitamente y es la prueba de que el refactor no dejó fugas del `if/else`
original.

## Por qué State-como-datos y no un enum cerrado

La versión Java previa de este mismo reto modeló las etapas como un `enum`
con un método `siguiente()` por constante. Es válido, pero asume que el
conjunto de etapas es fijo en tiempo de compilación — y el enunciado dice
explícitamente que **el proceso todavía se está definiendo y van a llegar
más etapas que hoy no se conocen**.

Por eso aquí `Etapa` es una clase de datos simple (`nombre`, `esFinal`,
`esPuntoDeDecision`) y `FlujoSeleccion` recibe el orden de etapas como un
arreglo en el constructor. Agregar una etapa futura (por ejemplo, una
`PRUEBA_PSICOTECNICA` entre `PRUEBA_TECNICA` y `OFERTA`) es insertar un
elemento en el arreglo que se arma en `main.ts` — ninguna clase de
`dominio`, `aplicacion` ni `infraestructura` se toca. Es una mejora
deliberada sobre la variante enum, no un cambio de patrón: `Candidato`
sigue delegando en el objeto `Etapa` actual (eso sigue siendo State), lo
que cambió es que la tabla de transiciones dejó de estar cableada en
código para ser configuración explícita en la raíz de composición.

No se agregó una capa de carga dinámica (JSON, base de datos, etc.) para
esto: el arreglo en `main.ts` ya cumple el requisito de extensibilidad sin
código, y agregar esa capa hoy sería sobreingeniería para un MVP — se
puede sumar después sin romper nada, porque `main.ts` es el único lugar
que construye el arreglo.

## Capas y regla de dependencia

```
src/
├── dominio/                      ← no importa nada de aplicacion ni infraestructura
│   ├── etapa.ts                        # Etapa (dato del State)
│   ├── flujoSeleccion.ts               # tabla de transiciones (State)
│   ├── candidato.ts                    # Candidato, Comando, TipoAccion, FabricaComandos
│   │                                    # (ComandoAvanzar/ComandoRechazar son privados al módulo)
│   ├── observadorEventos.ts            # Observer (interfaz)
│   └── canalNotificacion.ts            # Strategy (interfaz)
│
├── aplicacion/                   ← solo importa de dominio
│   ├── gestorCandidato.ts              # orquestador / caso de uso
│   ├── publicadorEventos.ts            # Observer (sujeto)
│   └── notificadorGerencia.ts          # Observer concreto: decide SI notificar
│
├── infraestructura/              ← solo importa de dominio
│   ├── emailCanal.ts                   # Strategy concreta
│   ├── smsCanal.ts                     # Strategy concreta (alternativa, intercambiable)
│   └── registradorAuditoria.ts         # Observer concreto (log)
│
└── main.ts                       ← raíz de composición: arma el flujo de etapas
                                     y cablea las tres capas a mano (sin DI framework)
```

La regla de dependencia se verificó con `grep` (ver comandos abajo):
`dominio` no tiene ni un solo `import` hacia las otras dos capas;
`aplicacion` e `infraestructura` solo importan de `dominio`, nunca una de
la otra.

```bash
grep -rn "^import" src/dominio | grep -v "from '\./"      # vacío
grep -rn "from '\.\./infraestructura" src/aplicacion       # vacío
grep -rn "from '\.\./aplicacion" src/infraestructura        # vacío
```

## Cómo se tradujo el `package-private` de Java

En Java, `Candidato.cambiarEstadoA(...)` era `package-private`: solo las
clases del mismo paquete (los `Comando`) podían mutar el estado, y eso lo
garantizaba el compilador. TypeScript no tiene visibilidad de paquete —
la unidad de encapsulamiento es el **módulo** (archivo). Por eso
`ComandoAvanzar` y `ComandoRechazar` viven en el mismo archivo que
`Candidato` (`dominio/candidato.ts`) y **no se exportan**: ningún otro
archivo del proyecto puede importarlos ni instanciarlos directamente (la
única forma de obtener un `Comando` es a través de `FabricaComandos`, que
sí se exporta). `Candidato.avanzarA(...)` queda como método público —
TypeScript no ofrece un equivalente estricto a package-private para ese
caso — pero en la práctica solo se invoca desde los dos comandos privados
al módulo. Esta limitación queda declarada explícitamente, no escondida.

## Deshacer multi-nivel

`GestorCandidato` guarda, por candidato, una pila (`Comando[]`) de
comandos ejecutados. `deshacerUltimoCambio` hace `pop()` y llama
`comando.deshacer()`: cada llamada retrocede un paso adicional sobre el
historial completo, no solo el último cambio en abstracto. El smoke test
en `main.ts` deshace dos veces seguidas para probarlo. No hay "rehacer"
hacia adelante — ver `SUPUESTOS.md`.

## Cómo ejecutar

```bash
npm install
npm run build
npm start
```

o en un solo paso durante desarrollo:

```bash
npx tsc && node dist/main.js
```

Sin dependencias de runtime: solo TypeScript como dependencia de
desarrollo (para compilar) y `@types/node` para tipar `console`/`assert`.
El código fuente no tiene comentarios — los nombres de clases, métodos y
carpetas son la documentación del diseño.

## Qué hace `main.ts`

Simula el mismo flujo que la versión Java del reto:

1. Define las etapas conocidas hoy y construye `FlujoSeleccion`.
2. Avanza tres etapas (`APLICADO → ENTREVISTA → PRUEBA_TECNICA → OFERTA`).
   Al llegar a `OFERTA` (punto de decisión) se dispara la notificación a
   gerencia — `GestorCandidato` no sabe que eso ocurrió.
3. Deshace el último cambio (`OFERTA → PRUEBA_TECNICA`).
4. Rechaza al candidato (`PRUEBA_TECNICA → RECHAZADO`).
5. Intenta avanzar desde una etapa final y verifica que lanza un error
   (guard de etapa final).
6. Deshace dos veces seguidas para probar el historial multi-nivel.

Cada paso se verifica con `assert` del propio Node (no se agregó un
framework de pruebas para no introducir una dependencia externa en un
ejemplo que busca ser mínimo).
