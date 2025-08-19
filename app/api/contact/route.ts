import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(10),
});

// Create transporter once and reuse (connection pooling)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10),
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  pool: true, // Enable connection pooling
  maxConnections: 5,
  maxMessages: 100,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = contactSchema.parse(body);

    const supabase = await createClient();

    // Execute database insert and email sending in parallel for better performance
    const [dbResult, emailResult] = await Promise.allSettled([
      // Database insert
      supabase
        .from('contact_submissions')
        .insert([
          {
            name,
            email,
            subject,
            message,
            created_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single(),

      // Email sending
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.CONTACT_EMAIL || 'support@natsukacard.com',
        subject: `Natsuka Contact: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h3 style="color: #333;">New Contact Form Submission</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Name:</td>
                <td style="padding: 8px;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Email:</td>
                <td style="padding: 8px;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Subject:</td>
                <td style="padding: 8px;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px; background: #f5f5f5; font-weight: bold; vertical-align: top;">Message:</td>
                <td style="padding: 8px;">${message.replace(/\n/g, '<br>')}</td>
              </tr>
            </table>
          </div>
        `,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`, // Fallback text version
      }),
    ]);

    // Check results
    let dbSuccess = false;
    let emailSuccess = false;

    if (dbResult.status === 'fulfilled' && !dbResult.value.error) {
      dbSuccess = true;
      console.log('Contact submission saved to database');
    } else {
      console.error(
        'Database error:',
        dbResult.status === 'rejected' ? dbResult.reason : dbResult.value.error
      );
    }

    if (emailResult.status === 'fulfilled') {
      emailSuccess = true;
      console.log('Email sent successfully');
    } else {
      console.error('Email error:', emailResult.reason);
    }

    // Return success if at least one operation succeeded
    if (dbSuccess || emailSuccess) {
      return NextResponse.json(
        {
          message: 'Message received successfully!',
          saved: dbSuccess,
          emailed: emailSuccess,
        },
        { status: 200 }
      );
    } else {
      throw new Error('Both database and email operations failed');
    }
  } catch (error) {
    console.error('Contact form error:', error);

    // Return appropriate error message
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid form data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to process your message. Please try again.' },
      { status: 500 }
    );
  }
}
