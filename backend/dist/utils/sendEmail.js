"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendEmailWithResend = async (options) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'OceanAlly <onboarding@resend.dev>',
            to: [options.email],
            subject: options.subject,
            text: options.message,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${options.subject}</h2>
        <p>${options.message.replace(/\n/g, '<br>')}</p>
        <hr>
        <small>This email was sent by OceanAlly</small>
      </div>`,
        });
        if (error) {
            console.error('Resend error:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
        console.log('Email sent successfully via Resend:', data?.id);
        return data;
    }
    catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};
exports.default = sendEmailWithResend;
