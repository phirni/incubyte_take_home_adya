# Test coverage report

Generated from `backend/`:

```text
pnpm exec vitest run --coverage
```

```
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
  - ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1). Use a `.mjs` extension or set `"type": "module"` in the closest package.json
Set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress this warning.
 DEPRECATED  `test.poolOptions` was removed in Vitest 4. All previous `poolOptions` are now top-level options. Please, refer to the migration guide: https://v4.vitest.dev/guide/migration#pool-rework

 RUN  v5.0.5 /home/adya/projects/car-dealership-inventory/backend
      Coverage enabled with v8

warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "test.db" at "file:./test.db"

The SQLite database "test.db" at "file:./test.db" was successfully reset.

🚀  Your database is now in sync with your Prisma schema. Done in 105ms

warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "test.db" at "file:./test.db"

The SQLite database "test.db" at "file:./test.db" was successfully reset.

🚀  Your database is now in sync with your Prisma schema. Done in 99ms

warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "test.db" at "file:./test.db"

The SQLite database "test.db" at "file:./test.db" was successfully reset.

🚀  Your database is now in sync with your Prisma schema. Done in 347ms

warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "test.db" at "file:./test.db"

The SQLite database "test.db" at "file:./test.db" was successfully reset.

🚀  Your database is now in sync with your Prisma schema. Done in 146ms

warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "test.db" at "file:./test.db"

The SQLite database "test.db" at "file:./test.db" was successfully reset.

🚀  Your database is now in sync with your Prisma schema. Done in 107ms

warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "test.db" at "file:./test.db"

The SQLite database "test.db" at "file:./test.db" was successfully reset.

🚀  Your database is now in sync with your Prisma schema. Done in 95ms

warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "test.db" at "file:./test.db"

The SQLite database "test.db" at "file:./test.db" was successfully reset.

🚀  Your database is now in sync with your Prisma schema. Done in 95ms


 Test Files  7 passed (7)
      Tests  100 passed (100)
   Start at  14:18:00
   Duration  34.92s (tests 84%, import 12%, transform 2%, setup 2%, worker 1%)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   94.57 |    82.75 |     100 |   95.42 |                   
 src               |   96.42 |       80 |     100 |     100 |                   
  config.ts        |      80 |       75 |     100 |     100 | 3-10              
 src/middleware    |   90.62 |    83.33 |     100 |      90 |                   
  auth.ts          |   93.33 |       90 |     100 |    92.3 | 19                
  errorHandler.ts  |   88.23 |       75 |     100 |   88.23 | 34-35             
 src/routes        |    93.9 |    80.43 |     100 |   94.73 |                   
  auth.ts          |   95.45 |       75 |     100 |      95 | 38                
  inventory.ts     |      90 |       80 |     100 |   94.44 | 41                
  ...Management.ts |      92 |       50 |     100 |    91.3 | 36,46             
 tests/helpers     |     100 |     90.9 |     100 |     100 |                   
  factory.ts       |     100 |     90.9 |     100 |     100 | 19                
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 94.57% ( 157/166 )
Branches     : 82.75% ( 72/87 )
Functions    : 100% ( 36/36 )
Lines        : 95.42% ( 146/153 )
================================================================================
```
