import { NextResponse } from 'next/server';

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'minimaxai/minimax-m3';

function getApiKey() {
  return process.env.NVIDIA_API_KEY || null;
}

export async function POST(req) {
  try {
    const apiKey = getApiKey();
    const { stats, type } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ 
        insight: "✨ Keep focusing on one task at a time — consistency beats intensity!"
      });
    }

    const systemPrompt = `You are a personal AI productivity coach. Given stats about a user's productivity, provide EXACTLY ONE short, encouraging, actionable sentence. Use an emoji at the start. No markdown. No asterisks. Respond with exactly one sentence.`;

    const userMessage = `Stats:
- Tasks completed: ${stats.completedTasks || 0}
- Active goals: ${stats.activeGoals || 0}  
- Habit streak: ${stats.bestStreak || 0} days
- Focus hours: ${stats.focusHours || 0}
- Insight type: ${type === 'analytics' ? 'analytical observation about trends' : 'quick motivational tip for today'}

Respond with exactly one sentence.`;

    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 8192,
        temperature: 1.00,
        top_p: 0.95,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA Insight API Error:', response.status, errorText);
      return NextResponse.json({ 
        insight: "✨ You're making steady progress. Keep focusing on one task at a time!" 
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || 
      "✨ You're making steady progress. Keep focusing on one task at a time!";
    
    return NextResponse.json({ insight: text });
  } catch (error) {
    console.error('AI Insight Error:', error.message);
    return NextResponse.json({ 
      insight: "✨ You're making steady progress. Keep focusing on one task at a time!" 
    });
  }
}
