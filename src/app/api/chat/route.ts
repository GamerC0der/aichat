import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const apiKey = request.headers.get("Authorization")

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }

  const response = await fetch("https://ai.hackclub.com/proxy/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.text()
    return new Response(error, {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    })
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  })
}




