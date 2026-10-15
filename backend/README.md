# Backend – App de roles y catálogo (Node.js + Express + MySQL)

Arquitectura **MVC + POO**:

```
src/
  config/Database.js        -> conexión a MySQL (pool)
  models/                   -> M: UserModel, ProductModel (todo el SQL vive aquí)
  views/                    -> V: UserView, ProductView (forma del JSON de respuesta)
  controllers/              -> C: AuthController, UserController, ProductController
  routes/                   -> qué URL llama a qué controlador
  middleware/auth.js        -> token (JWT) + permisos por rol
sql/schema.sql              -> tablas users, categories, products
scripts/setup.js            -> crea la BD, las tablas y datos de ejemplo
```

## 1. Requisitos
- **Node.js 18 o superior** (https://nodejs.org)
- **MySQL** encendido (MySQL Installer, XAMPP, etc.)

## 2. Primer arranque
Abre una terminal dentro de la carpeta `backend`:

```bash
npm install
copy .env.example .env      # (en Mac/Linux: cp .env.example .env)
```
Abre `.env` y pon tu contraseña de MySQL en `DB_PASSWORD` (si usas XAMPP suele ir vacía).
También cambia `JWT_SECRET` por cualquier texto largo.

```bash
npm run setup     # crea la BD "roles_app", las tablas y los datos de ejemplo
npm start         # enciende la API
```
Si todo salió bien verás algo como:
```
API lista en http://localhost:3000/api
  Desde tu celular (misma red Wi-Fi): http://192.168.1.50:3000/api
```
Prueba en el navegador: http://localhost:3000/health  →  `{"status":"ok"}`

## 3. Usuarios de ejemplo
| id | usuario     | contraseña  | rol           |
|----|-------------|-------------|---------------|
| 1  | johnd       | m38rmF$     | Administrador |
| 2  | mor_2314    | 83r5^_      | Administrador |
| 3  | kevinryan   | kev02937@   | Auditor       |
| 4+ | donero, derek, david_r, … | ver `scripts/seedData.js` | Cliente |

La regla de roles es la misma de la app: **id 1 y 2 = administrador, id 3 = auditor, el resto = cliente**.
Las contraseñas se guardan con hash (bcrypt), nunca en texto plano.

## 4. Endpoints
Todos (menos el login) exigen `Authorization: Bearer <token>`.

| Método | URL | Quién | Qué hace |
|--------|-----|-------|----------|
| POST   | /api/auth/login | cualquiera | Login → `{ token, user }` |
| GET    | /api/users | admin, auditor | Mostrar usuarios |
| GET    | /api/users/:id | admin, auditor | Mostrar un usuario |
| POST   | /api/users | admin | Agregar usuario |
| GET    | /api/products | autenticado | Mostrar productos |
| GET    | /api/products/:id | autenticado | Mostrar producto por ID |
| GET    | /api/products/categories | autenticado | Listar categorías |
| GET    | /api/products/category/:nombre | autenticado | Productos de una categoría |
| POST   | /api/products | admin | Agregar producto |
| PUT    | /api/products/:id | admin | Editar producto |
| DELETE | /api/products/:id | admin | Borrar producto |

Un cliente/auditor que intente crear, editar o borrar recibe **403**: el permiso se valida en el servidor, no solo en la app.

### Probarlo sin la app (PowerShell)
```powershell
$r = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType 'application/json' -Body '{"username":"mor_2314","password":"83r5^_"}'
Invoke-RestMethod http://localhost:3000/api/products -Headers @{Authorization="Bearer $($r.token)"}
```

## 5. Conectar la app Flutter
1. Reemplaza la carpeta `lib` de tu proyecto por la de `lib_con_backend.zip`.
2. Abre `lib/services/api_config.dart` y pon la URL de tu backend:
   - **Emulador de Android:** `http://10.0.2.2:3000/api` (ya viene así)
   - **Celular físico:** `http://<IP-de-tu-PC>:3000/api` (la IP aparece en la consola del backend). El celular y la PC deben estar en la **misma red Wi-Fi**.
3. En `android/app/src/main/AndroidManifest.xml` agrega el permiso de internet y permite HTTP (sin https) mientras desarrollas:
   ```xml
   <uses-permission android:name="android.permission.INTERNET"/>
   <application
       android:usesCleartextTraffic="true"
       ... (el resto de tus atributos igual)>
   ```
4. `flutter clean` → `flutter pub get` → `flutter run`.

**Si el celular no conecta:** permite Node.js en el Firewall de Windows (aparece una ventana la primera vez; marca "Redes privadas"), o abre el puerto 3000.
