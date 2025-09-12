// Install: npm install resend
// Sign up at https://resend.com (free tier: 3000 emails/month)

import { Resend } from 'resend';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmailWithResend = async (options: EmailOptions) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'OceanAlly <onboarding@resend.dev>', // Use this for testing
      // from: 'OceanAlly <noreply@yourdomain.com>', // Use your domain after verification
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
  } catch (error: any) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

export default sendEmailWithResend;

// Add to your .env:
// RESEND_API_KEY=your_resend_api_key_here