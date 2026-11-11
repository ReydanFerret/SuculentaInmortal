# Preparar PocketBase Mobile para las nuevas funciones

La app usa el servidor PocketBase Mobile indicado en `script.js`. Para activar historial, diario sincronizado, mediciones ambientales y campos por planta, agrega estos campos y colecciones desde el panel `/_/`. No importes este documento como si fuera un schema JSON: son pasos para el editor de colecciones de PocketBase.

**No ejecutes SQL `CREATE TABLE` directamente contra PocketBase.** PocketBase crea las tablas y mantiene sus reglas y metadatos cuando guardas colecciones. La migración oficial [1794400000_suculenta_features.js](pb_migrations/1794400000_suculenta_features.js) automatiza los cambios si puedes copiarla al directorio `pb_migrations` de la instancia y aplicar migraciones con el ejecutable PocketBase (`migrate up`, o reiniciando una instancia con migraciones automáticas). Si PocketBase Mobile no ofrece acceso a ese directorio ni a `migrate up`, usa las instrucciones de este documento en el panel. Haz una copia de seguridad antes de modificar el esquema.

## Importación desde PocketBase Mobile

El archivo [pocketbase_mobile_import.json](pocketbase_mobile_import.json) está preparado con el esquema exportado de esta instancia: conserva los campos existentes de `plantas` (ID `pbc_114875327`), agrega `ubicacion`, `avisoriego`, `avisoabono` y `horaaviso`, y crea `cuidados`, `diario` y `mediciones_ambiente` con relaciones a los IDs correctos.

1. Haz primero una copia de seguridad del esquema desde el panel.
2. Abre **Import collections**, selecciona el JSON y revisa la vista previa: debe modificar `plantas` y crear las tres colecciones nuevas.
3. Deja desactivada **Delete missing collections/fields** (`deleteMissing: false`) y confirma la importación.
4. Verifica que `plantas` tenga el Create rule `@request.auth.id != "" && user = @request.auth.id`; así se evita crear plantas asignadas a otra cuenta.

La regla de creación de `plantas` exportada anteriormente solo comprobaba que hubiera una sesión autenticada; el JSON la endurece para comprobar también la relación `user`. La importación de PocketBase acepta configuraciones parciales; con `deleteMissing` activo puede borrar colecciones o campos omitidos. [Referencia oficial de importación](https://pocketbase.io/docs/api-collections/).

## Campos nuevos en `plantas`

Agrega los siguientes campos a la colección existente:

| Nombre | Tipo | Requerido | Uso |
| --- | --- | --- | --- |
| `ubicacion` | Text | No | Lugar de la planta, por ejemplo ventana o patio |
| `avisoriego` | Bool | No | Activar o desactivar los avisos de riego |
| `avisoabono` | Bool | No | Activar o desactivar los avisos de fertilización |
| `horaaviso` | Text | No | Hora local `HH:mm`, por ejemplo `09:00`; si queda vacío en una planta antigua, la app mantiene avisos activos y usa 09:00 |

También ajusta el **Create rule** existente de `plantas` para que un usuario solo pueda asignar plantas a su propia cuenta:

```text
@request.auth.id != "" && user = @request.auth.id
```

Las reglas list/view/update/delete existentes, que comprueban el propietario, se conservan.

## Colección `cuidados`

Tipo: **Base**. Crea estos campos:

| Nombre | Tipo | Configuración |
| --- | --- | --- |
| `user` | Relation | Colección `users`, una relación, requerido |
| `planta` | Relation | Colección `plantas`, una relación, requerido, activar cascade delete |
| `tipo` | Select | Una selección: `riego`, `fertilizacion`, `fertilizacion_liquida`; requerido |
| `fecha` | Date | Requerido |
| `nota` | Text | Opcional |

Reglas recomendadas:

```text
List rule:   @request.auth.id != "" && user = @request.auth.id
View rule:   @request.auth.id != "" && user = @request.auth.id
Create rule: @request.auth.id != "" && user = @request.auth.id && planta.user = @request.auth.id
Update rule: @request.auth.id != "" && user = @request.auth.id
Delete rule: @request.auth.id != "" && user = @request.auth.id
```

## Colección `diario`

Tipo: **Base**. Crea estos campos:

| Nombre | Tipo | Configuración |
| --- | --- | --- |
| `user` | Relation | Colección `users`, una relación, requerido |
| `planta` | Relation | Colección `plantas`, una relación, requerido, activar cascade delete |
| `fecha` | Date | Requerido |
| `texto` | Text | Requerido |
| `foto` | File | Opcional, selección máxima 1, imágenes |

Usa `user = @request.auth.id` para list/view/delete, `@request.auth.id != "" && user = @request.auth.id && planta.user = @request.auth.id` para create, y `@request.auth.id != "" && user = @request.auth.id && planta.user = @request.auth.id` para update. Así se verifica que tanto el registro como su planta sean del usuario.

## Colección `mediciones_ambiente`

Tipo: **Base**. Crea estos campos:

| Nombre | Tipo | Configuración |
| --- | --- | --- |
| `user` | Relation | Colección `users`, una relación, requerido |
| `planta` | Relation | Colección `plantas`, una relación, requerido, activar cascade delete |
| `fecha` | Date | Requerido |
| `temperatura` | Number | Opcional |
| `humedad` | Number | Opcional |

Aplica las mismas reglas de acceso que `diario`: list/view/delete por propietario y create/update con comprobación de que el usuario y la planta relacionados pertenecen a la sesión.

## Después de guardar el esquema

1. Inicia sesión en Suculenta Inmortal con la cuenta habitual.
2. Registra un riego, una entrada de diario y una medición ambiental; comprueba que aparecen en las colecciones `cuidados`, `diario` y `mediciones_ambiente`.
3. Si quieres usar la app sin conexión, vuelve a abrirla una vez con conexión para descargar los datos. Los cambios pendientes se guardan en el dispositivo y se sincronizan cuando vuelve la conexión.

El respaldo JSON exporta fotos de plantas y diario. La importación agrega copias a la cuenta actual; no borra ni reemplaza los registros que ya existen. Para proteger los datos, importa respaldos solo de confianza.
