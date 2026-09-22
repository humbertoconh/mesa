# Mesa

Contador de calorías y planificador de comidas para una casa entera.
Fase 1: acceso, alta del hogar, objetivo personal y pantalla del día.

## Ponerlo en marcha

1. **Supabase** — proyecto nuevo, y en el SQL Editor pega `schema.sql` entero.
   Luego Storage → bucket privado `fotos-comidas`.
2. **Variables** — copia `.env.local.example` a `.env.local` y rellénalo.
3. **Arrancar**

   ```bash
   npm install
   npm run dev
   ```

4. **Vercel** — subes el repo, pegas las tres variables en Settings →
   Environment Variables y ya despliega solo en cada push.

## Cómo está montado

| Carpeta | Qué hay |
|---|---|
| `src/app/entrar` | Acceso y alta de cuenta |
| `src/app/empezar` | Crear hogar o entrar con código |
| `src/app/perfil` | Datos personales y cálculo del objetivo |
| `src/app/hoy` | La pantalla del día |
| `src/app/api/desglosar` | Convierte texto en alimentos con IA |
| `src/lib/objetivo.ts` | Mifflin-St Jeor y reparto de macros |
| `src/lib/supabase` | Clientes de navegador, servidor y middleware |

## Decisiones que conviene no tocar sin pensarlo

- **Las calorías se congelan al guardar.** El registro no enlaza al alimento:
  guarda las cifras calculadas. Si mañana corriges una ficha, el histórico
  no se mueve.
- **La clave de Anthropic vive sólo en el servidor.** La ruta `/api/desglosar`
  comprueba la sesión antes de llamar, para que nadie la gaste desde fuera.
- **`hoyISO()` usa fecha local.** Con UTC, a partir de las 2 de la mañana en
  España la cena se registraría en el día siguiente.

## Lo siguiente

Recetario de la casa, menú semanal con raciones por persona y lista de la
compra. Todas las tablas ya están creadas en `schema.sql`.
