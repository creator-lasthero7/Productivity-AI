import { NextResponse } from 'next/server';

function getApiKey() {
  return process.env.NVIDIA_API_KEY || null;
}

export async function POST(req) {
  try {
    const apiKey = getApiKey();
    const { message, tasks, habits } = await req.json();

    if (!apiKey) {
      return NextResponse.json({
        reply: "⚠️ NVIDIA API key not found. Please check your .env.local file and restart the dev server.",
        action: { type: 'NONE' }
      });
    }

    const taskList = (tasks || []).map(t => `- [${t.done ? 'x' : ' '}] ${t.title} (id:${t.id})`).join('\n');
    const habitList = (habits || []).map(h => `- ${h.name} (streak: ${h.streak})`).join('\n');

    const systemPrompt = `You are a helpful productivity assistant. You help users manage tasks, habits, and stay productive.

INSTRUCTIONS:
- If the user wants to CREATE a task, respond with JSON: {"reply":"your message","action":{"type":"CREATE_TASK","payload":{"title":"task name","priority":"HIGH"}}}
- If the user wants to COMPLETE a task, respond with JSON: {"reply":"your message","action":{"type":"COMPLETE_TASK","payload":{"id":"task_id"}}}
- If the user wants to CREATE a habit, respond with JSON: {"reply":"your message","action":{"type":"CREATE_HABIT","payload":{"name":"habit name","emoji":"🔥"}}}
- For all other messages, respond with JSON: {"reply":"your conversational response","action":{"type":"NONE"}}

IMPORTANT: Respond ONLY with a valid JSON object. No markdown. No code blocks. No extra text.`;

    const userMessage = `User said: "${message}"

Current tasks:
${taskList || '(none)'}

Current habits:
${habitList || '(none)'}`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nvidia API Error:', response.status, errorText);
      return NextResponse.json({
        reply: `⚠️ AI service returned an error (${response.status}). The API key may be invalid or expired. Please check your NVIDIA_API_KEY.`,
        action: { type: 'NONE' }
      });
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content?.trim() || '';

    // Try to parse as JSON
    let parsed;
    try {
      // Remove any accidental markdown code blocks
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      // If not valid JSON, wrap it
      parsed = { reply: responseText, action: { type: 'NONE' } };
    }

    return NextResponse.json(parsed);

  } catch (error) {
    console.error('AI Chat Error:', error.message || error);
    return NextResponse.json({
      reply: "⚠️ Something went wrong: " + (error.message || 'Unknown error. Please try again.'),
      action: { type: 'NONE' }
    });
  }
}

