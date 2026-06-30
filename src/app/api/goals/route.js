import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src/data/db.json');

async function getDbData() {
  try {
    const fileData = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileData);
  } catch (err) {
    return { users: [], tasks: [], habits: [], events: [], goals: [] };
  }
}

async function writeDbData(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

const getUserEmail = (req) => req.headers.get('x-user-email');

export async function GET(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const db = await getDbData();
    const userGoals = (db.goals || []).filter(g => g.userEmail === userEmail);
    
    return NextResponse.json(userGoals);
  } catch (error) {
    console.error('GET Goals Error:', error);
    return NextResponse.json({ error: 'Failed to read goals' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const goal = await request.json();
    
    const id = Date.now();
    const newGoal = {
      ...goal,
      userEmail,
      id,
      progress: 0,
      milestones: goal.milestones || []
    };
    
    const db = await getDbData();
    if (!db.goals) db.goals = [];
    db.goals.push(newGoal);
    await writeDbData(db);
    
    return NextResponse.json(newGoal);
  } catch (error) {
    console.error('POST Goal Error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, ...updatedFields } = await request.json();
    
    const db = await getDbData();
    if (!db.goals) db.goals = [];
    
    const index = db.goals.findIndex(g => g.id === id && g.userEmail === userEmail);
    if (index === -1) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    
    db.goals[index] = { ...db.goals[index], ...updatedFields };
    await writeDbData(db);
    
    return NextResponse.json(db.goals[index]);
  } catch (error) {
    console.error('PUT Goal Error:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

