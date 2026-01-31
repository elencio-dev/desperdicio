# 📖 API Specification Detail (Food Surplus)

Esta documentação detalha todos os endpoints disponíveis na API, seus requisitos de autenticação, payloads e respostas esperadas.

---

## 🔐 Autenticação (Domínio: `/api/auth`)

O sistema utiliza o **Better Auth** para gerenciar sessões e autenticação.

### Endpoints Baseados no Better Auth:
-   `POST /api/auth/sign-up`: Registro de novo usuário (Define role: `RESTAURANT` ou `CONSUMER`).
-   `POST /api/auth/sign-in`: Login e criação de sessão.
-   `POST /api/auth/sign-out`: Encerramento de sessão.
-   `GET /api/auth/get-session`: Recupera dados da sessão ativa.

---

## 🏪 Restaurantes (Domínio: `/api/restaurants`)

Gerenciamento de perfis e horários de funcionamento.

### `POST /api/restaurants`
-   **Descrição:** Registra os detalhes do perfil do restaurante após a criação do usuário.
-   **Auth:** Obrigatório (User Role: `RESTAURANT`).
-   **Payload:**
    ```json
    {
      "cnpj": "00.000.000/0001-00",
      "name": "Restaurante Exemplo",
      "phone": "11999999999",
      "address": "Rua Exemplo, 123",
      "latitude": -23.5505,
      "longitude": -46.6333
    }
    ```
-   **Resposta:** `201 Created`

---

## 📦 Ofertas (Domínio: `/api/offers`)

Core do marketplace para busca e criação de excedentes.

### `GET /api/offers`
-   **Descrição:** Lista ofertas ativas com filtros geográficos e alimentares.
-   **Query Params:** `latitude`, `longitude`, `maxDistance` (km), `isVegetarian` (boolean).
-   **Resposta:** Lista de objetos `Offer`.

### `POST /api/offers`
-   **Descrição:** Cria uma nova oferta de excedente.
-   **Auth:** Obrigatório (User Role: `RESTAURANT`).
-   **Regras:** Desconto mínimo de 30%, Janela de retirada 1-3h.

---

## 🛒 Pedidos e Checkout (Domínio: `/api/orders`)

Fluxo transacional e financeiro.

### `POST /api/orders`
-   **Descrição:** Cria um pedido para uma oferta específica.
-   **Auth:** Obrigatório (User Role: `CONSUMER`).
-   **Payload:** `{ "offerId": "uuid", "quantity": 1, "paymentMethod": "PIX" }`
-   **Fluxo:** O sistema calcula automaticamente a `PlatformFee` (15%).

---

## 🔔 Notificações e Webhooks

### `POST /api/webhooks/mercadopago`
-   **Descrição:** Endpoint assíncrono para receber atualizações de pagamento.
-   **Processamento:** Validação de integridade e atualização do status do pedido para `CONFIRMED`.

---
**Padrão de Resposta de Erro:**
```json
{
  "error": "Descrição do erro legível para o desenvolvedor",
  "code": "ERROR_CODE_STANDARD"
}
```
