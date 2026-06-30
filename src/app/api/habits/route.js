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
    const userHabits = (db.habits || []).filter(h => h.userEmail === userEmail);
    
    return NextResponse.json(userHabits);
  } catch (error) {
    console.error('GET Habits Error:', error);
    return NextResponse.json({ error: 'Failed to read habits' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const habit = await request.json();
    
    const id = Date.now();
    const newHabit = {
      ...habit,
      userEmail,
      id,
      streak: 0,
      completed: 0,
      history: []
    };
    
    const db = await getDbData();
    if (!db.habits) db.habits = [];
    db.habits.push(newHabit);
    await writeDbData(db);
    
    return NextResponse.json(newHabit);
  } catch (error) {
    console.error('POST Habit Error:', error);
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, ...updatedFields } = await request.json();
    
    const db = await getDbData();
    if (!db.habits) db.habits = [];
    
    const index = db.habits.findIndex(h => h.id === id && h.userEmail === userEmail);
    if (index === -1) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }
    
    db.habits[index] = { ...db.habits[index], ...updatedFields };
    await writeDbData(db);
    
    return NextResponse.json(db.habits[index]);
  } catch (error) {
    console.error('PUT Habit Error:', error);
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}

