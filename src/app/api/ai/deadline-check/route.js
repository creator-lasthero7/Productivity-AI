import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function getApiKey() {
  return process.env.NVIDIA_API_KEY || null;
}

/**
 * Finds tasks with deadlines approaching within the next 24 hours.
 * This is also done client-side as a pre-filter, but we double-check server-side.
 */
function findUrgentTasks(tasks) {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return tasks.filter((task) => {
    if (task.done || !task.dueDate) return false;

    // Build the deadline Date from dueDate + dueTime
    let deadlineStr = task.dueDate; // e.g. "2026-06-29"
    if (task.dueTime) {
      // Convert "12:00 PM" → "12:00" 24hr for parsing
      const timeParts = task.dueTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1], 10);
        const mins = timeParts[2];
        const ampm = timeParts[3];
        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
          if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }
        deadlineStr += `T${String(hours).padStart(2, '0')}:${mins}:00`;
      }
    } else {
      // Default to end of day
      deadlineStr += 'T23:59:59';
    }

    const deadline = new Date(deadlineStr);
    return deadline >= now && deadline <= in24Hours;
  });
}

/**
 * Categorize urgency based on how close the deadline is.
 */
function getUrgencyLevel(task) {
  const now = new Date();
  let deadlineStr = task.dueDate;
  if (task.dueTime) {
    const timeParts = task.dueTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1], 10);
      const mins = timeParts[2];
      const ampm = timeParts[3];
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
      deadlineStr += `T${String(hours).padStart(2, '0')}:${mins}:00`;
    }
  } else {
    deadlineStr += 'T23:59:59';
  }
  const deadline = new Date(deadlineStr);
  const hoursLeft = (deadline - now) / (1000 * 60 * 60);

  if (hoursLeft <= 1) return 'CRITICAL';    // Less than 1 hour
  if (hoursLeft <= 6) return 'HIGH';        // Less than 6 hours
  return 'APPROACHING';                     // Within 24 hours
}

function formatTimeLeft(task) {
  const now = new Date();
  let deadlineStr = task.dueDate;
  if (task.dueTime) {
    const timeParts = task.dueTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1], 10);
      const mins = timeParts[2];
      const ampm = timeParts[3];
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
      deadlineStr += `T${String(hours).padStart(2, '0')}:${mins}:00`;
    }
  } else {
    deadlineStr += 'T23:59:59';
  }
  const deadline = new Date(deadlineStr);
  const diff = deadline - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export async function POST(req) {
  try {
    const { userEmail, userName } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const q = query(collection(db, 'tasks'), where('userEmail', '==', userEmail));
    const snapshot = await getDocs(q);
    const userTasks = snapshot.docs.map(doc => doc.data());

    const urgentTasks = findUrgentTasks(userTasks);

    // No urgent tasks → no API call, no cost
    if (urgentTasks.length === 0) {
      return NextResponse.json({ alerts: [], emailSent: false });
    }

    const apiKey = getApiKey();

    // Build alerts with or without AI
    const alerts = [];

    if (apiKey) {
      // Use Llama to generate personalized alert messages
      const taskDescriptions = urgentTasks.map((t, i) => {
        const urgency = getUrgencyLevel(t);
        const timeLeft = formatTimeLeft(t);
        return `${i + 1}. "${t.title}" (Priority: ${t.priority}, Due in: ${timeLeft}, Urgency: ${urgency})`;
      }).join('\n');

      const systemPrompt = `You are a productivity AI assistant generating deadline alerts. For each task below, write a short, urgent, motivating notification message (1 sentence max). Use an appropriate emoji. Be specific about the time remaining. Output as a JSON array of strings, one per task.

IMPORTANT: Respond ONLY with a JSON array of strings. No markdown. No code blocks.`;

      const userMessage = `Generate alert messages for these approaching deadlines:\n${taskDescriptions}`;

      try {
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
            temperature: 0.8,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content?.trim() || '';
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

          let aiMessages;
          try {
            aiMessages = JSON.parse(cleaned);
          } catch {
            aiMessages = null;
          }

          urgentTasks.forEach((task, i) => {
            alerts.push({
              id: `deadline-${task.id}-${Date.now()}`,
              taskId: task.id,
              title: task.title,
              text: aiMessages?.[i] || `⏰ "${task.title}" is due in ${formatTimeLeft(task)}! Time to wrap it up.`,
              urgency: getUrgencyLevel(task),
              timeLeft: formatTimeLeft(task),
              dueDate: task.dueDate,
              dueTime: task.dueTime || '',
              priority: task.priority,
              type: 'DEADLINE',
              read: false,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            });
          });
        } else {
          // API failed, use fallback messages
          urgentTasks.forEach((task) => {
            alerts.push({
              id: `deadline-${task.id}-${Date.now()}`,
              taskId: task.id,
              title: task.title,
              text: `⏰ "${task.title}" is due in ${formatTimeLeft(task)}! Don't miss this deadline.`,
              urgency: getUrgencyLevel(task),
              timeLeft: formatTimeLeft(task),
              dueDate: task.dueDate,
              dueTime: task.dueTime || '',
              priority: task.priority,
              type: 'DEADLINE',
              read: false,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            });
          });
        }
      } catch (aiError) {
        console.error('AI deadline alert generation failed:', aiError.message);
        // Fallback alerts without AI
        urgentTasks.forEach((task) => {
          alerts.push({
            id: `deadline-${task.id}-${Date.now()}`,
            taskId: task.id,
            title: task.title,
            text: `⏰ "${task.title}" is due in ${formatTimeLeft(task)}! Don't miss this deadline.`,
            urgency: getUrgencyLevel(task),
            timeLeft: formatTimeLeft(task),
            dueDate: task.dueDate,
            dueTime: task.dueTime || '',
            priority: task.priority,
            type: 'DEADLINE',
            read: false,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          });
        });
      }
    } else {
      // No API key — use basic fallback messages (no cost at all)
      urgentTasks.forEach((task) => {
        alerts.push({
          id: `deadline-${task.id}-${Date.now()}`,
          taskId: task.id,
          title: task.title,
          text: `⏰ "${task.title}" is due in ${formatTimeLeft(task)}! Time to focus.`,
          urgency: getUrgencyLevel(task),
          timeLeft: formatTimeLeft(task),
          dueDate: task.dueDate,
          dueTime: task.dueTime || '',
          priority: task.priority,
          type: 'DEADLINE',
          read: false,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        });
      });
    }

    // Send deadline alert email
    let emailSent = false;
    if (alerts.length > 0) {
      try {
        const emailRes = await fetch(new URL('/api/email', req.url).href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'deadline-alert',
            email: userEmail,
            name: userName || 'User',
            alerts,
          }),
        });
        if (emailRes.ok) {
          const emailData = await emailRes.json();
          emailSent = emailData.success;
        }
      } catch (emailErr) {
        console.error('Failed to send deadline email:', emailErr.message);
      }
    }

    return NextResponse.json({ alerts, emailSent });
  } catch (error) {
    console.error('Deadline check error:', error.message);
    return NextResponse.json({ alerts: [], emailSent: false, error: error.message }, { status: 500 });
  }
}
