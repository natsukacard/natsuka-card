import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PASSWORD = process.env.SITE_PASSWORD || 'natsuka-beta-2025';
const COOKIE_NAME = 'site-access-token';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password === PROTECTED_PASSWORD) {
      const response = NextResponse.json({ success: true });

      response.cookies.set(COOKIE_NAME, password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
