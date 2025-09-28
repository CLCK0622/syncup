import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { startTime, endTime, availableUsers, duration } = await req.json();

    if (!startTime || !endTime || !availableUsers || duration === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Construct a prompt for GPT-4, asking for a casual and concise suggestion for friends
    const prompt = `Suggest a casual and concise activity (around 50 words) for a ${duration} minute hangout among friends: ${availableUsers.join(', ')} from ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}. Focus on fun and relaxation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // You can use "gpt-3.5-turbo" for a faster, cheaper option
      messages: [
        { role: "system", content: "You are a helpful assistant that suggests casual and concise activities for a hangout among friends based on participants and duration." },
        { role: "user", content: prompt }
      ],
      max_tokens: 75, // Limit the length of the suggestion to roughly 50 words
      temperature: 0.8, // Slightly higher temperature for more creative, casual suggestions
    });

    const suggestion = completion.choices[0].message.content;

    return NextResponse.json({ suggestion });

  } catch (error) {
    console.error('Error in GPT suggestions API route:', error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
