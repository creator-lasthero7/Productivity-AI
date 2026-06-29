import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getDbPath = () => path.join(process.cwd(), 'src', 'data', 'db.json');

const readDb = () => {
  const filePath = getDbPath();
  const fileData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileData);
};

const writeDb = (data) => {
  const filePath = getDbPath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const getUserEmail = (req) => req.headers.get('x-user-email');

export async function GET(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = readDb();
    const userHabits = db.habits.filter(h => h.userEmail === userEmail);
    return NextResponse.json(userHabits);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read habits' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const habit = await request.json();
    const db = readDb();
    
    const newHabit = {
      ...habit,
      userEmail,
      id: Date.now(),
      streak: 0,
      completed: 0,
      history: []
    };
    
    db.habits.push(newHabit);
    writeDb(db);
    
    return NextResponse.json(newHabit);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, ...updatedFields } = await request.json();
    const db = readDb();
    
    let updatedHabit = null;
    db.habits = db.habits.map((h) => {
      if (h.id === id && h.userEmail === userEmail) {
        updatedHabit = { ...h, ...updatedFields };
        return updatedHabit;
      }
      return h;
    });
    
    if (!updatedHabit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }
    
    writeDb(db);
    return NextResponse.json(updatedHabit);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}
