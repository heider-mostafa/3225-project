import { NextResponse } from "next/server";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!N8N_WEBHOOK_URL) {
      throw new Error("N8N_WEBHOOK_URL is not configured");
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message to n8n");
    }

    const data = await response.json();

    return NextResponse.json({ response: data.response });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
} 