/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints de autenticação via Better Auth
 */

/**
 * @swagger
 * /api/auth/sign-up/email:
 *   post:
 *     tags: [Authentication]
 *     summary: Cadastro básico de usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUpEmail'
 *     responses:
 *       200:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       400:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/sign-in/email:
 *   post:
 *     tags: [Authentication]
 *     summary: Login com e-mail e senha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignInEmail'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       401:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/email-otp/verify-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Verificar e-mail com código OTP
 *     description: Valida o código de 6 dígitos enviado por e-mail.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: E-mail verificado com sucesso
 *       400:
 *         description: Código inválido ou expirado
 */

/**
 * @swagger
 * /api/auth/email-otp/send-verification-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Reenviar código de verificação
 *     description: Envia um novo código OTP para o e-mail do usuário.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, type]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               type:
 *                 type: string
 *                 enum: [email-verification]
 *                 default: email-verification
 *     responses:
 *       200:
 *         description: Código enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Erro ao enviar código
 */

/**
 * @swagger
 * /api/auth/get-session:
 *   get:
 *     tags: [Authentication]
 *     summary: Obter dados da sessão atual
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: Sessão ativa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       401:
 *         description: Sessão inválida ou expirada
 */

/**
 * @swagger
 * /api/auth/sign-out:
 *   post:
 *     tags: [Authentication]
 *     summary: Encerrar sessão
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: Sessão encerrada com sucesso
 */
