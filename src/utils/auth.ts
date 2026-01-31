import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { Resend } from 'resend';
import prisma from "./prisma.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                console.log('Sending OTP email to:', email, 'OTP:', otp);
                try {
                    await resend.emails.send({
                        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                        to: email,
                        subject: 'Seu código de verificação - Food Surplus',
                        html: `
                            <h1>Bem-vindo ao Food Surplus!</h1>
                            <p>Seu código de verificação é:</p>
                            <h2 style="font-size: 32px; letter-spacing: 5px; color: #007bff;">${otp}</h2>
                            <p>Este código expira em 5 minutos.</p>
                            <p>Se você não solicitou este código, ignore este e-mail.</p>
                        `
                    });
                    console.log('OTP email sent successfully');
                } catch (error) {
                    console.error('Error sending OTP email:', error);
                }
            },
            sendVerificationOnSignUp: true,
        })
    ],
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 dias
        updateAge: 60 * 60 * 24, // 1 dia
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "CONSUMER",
            },
        },
    },
    baseURL: process.env.API_URL || "http://localhost:3000",
    trustedOrigins: [
        "http://localhost:3000",
        // Adicione outras origens confiáveis aqui ou via variável de ambiente
        process.env.API_URL,
        process.env.FRONTEND_URL,
    ].filter(Boolean) as string[],
});
