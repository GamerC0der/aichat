import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('input')
  const model = searchParams.get('model') || 'tts-1'
  const voice = searchParams.get('voice') || 'alloy'
  const response_format = searchParams.get('response_format') || 'mp3'
  const prompt = searchParams.get('prompt') || 'Speak in a natural, conversational tone.'

  if (!input) {
    return NextResponse.json({ error: 'Input text is required' }, { status: 400 })
  }

  try {
    const params = new URLSearchParams({
      input,
      prompt,
      voice,
      model,
      response_format
    })

    const response = await fetch(`https://www.openai.fm/api/generate?${params}`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-fetch-dest': 'audio',
        'sec-fetch-mode': 'no-cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'referer': 'https://www.openai.fm'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to generate audio' }, { status: response.status })
    }
    
    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': `audio/${response_format}`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('TTS API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
