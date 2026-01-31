# Fluxo de Autenticação - Food Surplus

Este documento descreve como funciona o sistema de autenticação e autorização baseado em **Better Auth** e **Express 5**.

## 🚀 Como Funciona
O sistema utiliza sessões baseadas em banco de dados. Ao fazer login ou se cadastrar, o servidor cria uma sessão no banco de dados (tabela `sessions`) e retorna um token/cookie para o cliente.

### 1. Cadastro (Sign-up)
Existem dois endpoints especializados para criar o usuário e seu perfil de negócio simultaneamente:

- **Restaurante:** `POST /api/restaurants/register`
- **Consumidor:** `POST /api/consumers/register`

**O que acontece internamente:**
1. O controlador chama `auth.api.signUpEmail` para criar a conta de autenticação.
2. Com o `userId` retornado, o controlador cria o perfil na tabela `restaurants` ou `consumers`.
3. O vínculo é garantido pelo campo `userId` no banco de dados.

### 2. Login (Sign-in)
O login é gerenciado diretamente pelo Better Auth:
- **Endpoint:** `POST /api/auth/sign-in/email`
- **Body:** `{ "email": "...", "password": "..." }`

### 3. Autorização (Middleware)
Para proteger rotas, utilizamos o `auth.middleware.ts`:

```typescript
import { authenticate, isRestaurant } from '../middleware/auth.middleware.js';

router.get('/profile', authenticate, isRestaurant, controller.getProfile);
```

- `authenticate`: Valida se a sessão existe e é válida.
- `isRestaurant` / `isConsumer`: Valida se a `role` no banco (via Better Auth) corresponde ao acesso esperado.

## 🛠️ Endpoints de Autenticação (Better Auth)
Todos os endpoints abaixo respondem sob o prefixo `/api/auth/*`:

| Endpoint | Método | Descrição |
|----------|---------|-----------|
| `/sign-up/email` | POST | Cadastro básico de usuário |
| `/sign-in/email` | POST | Login com e-mail e senha |
| `/sign-out` | POST | Encerra a sessão atual |
| `/get-session` | GET | Retorna os dados da sessão e usuário logado |
| `/change-password` | POST | Altera a senha do usuário |

## 🧪 Como testar no Swagger
1. Vá até `/api-docs`.
2. Use o endpoint `/api/auth/sign-in/email` para obter uma sessão.
3. Copie o token retornado (se estiver usando header) ou os cookies serão gerenciados pelo navegador.
4. Para rotas protegidas que exigem header: Clique em **Authorize** e insira o token da sessão.
