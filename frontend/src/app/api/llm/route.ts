import { NextRequest, NextResponse } from 'next/server';
import { analyzeImageWithLLM } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { image_base64, model } = await req.json();

    if (!image_base64) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 });
    }

    const results = await analyzeImageWithLLM(image_base64, model);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('LLM Analysis Error:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
