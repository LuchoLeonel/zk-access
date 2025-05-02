// src/app/api/exchange-code/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    });

    const { access_token } = response.data;

    return NextResponse.json({ access_token });
  } catch (error) {
    console.error("Error exchanging code:", error);
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
  }
}
