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
    const userGoals = db.goals.filter(g => g.userEmail === userEmail);
    return NextResponse.json(userGoals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read goals' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const goal = await request.json();
    const db = readDb();
    
    const newGoal = {
      ...goal,
      userEmail,
      id: Date.now(),
      progress: 0,
      milestones: goal.milestones || []
    };
    
    db.goals.push(newGoal);
    writeDb(db);
    
    return NextResponse.json(newGoal);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, ...updatedFields } = await request.json();
    const db = readDb();
    
    let updatedGoal = null;
    db.goals = db.goals.map((g) => {
      if (g.id === id && g.userEmail === userEmail) {
        updatedGoal = { ...g, ...updatedFields };
        return updatedGoal;
      }
      return g;
    });
    
    if (!updatedGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    
    writeDb(db);
    return NextResponse.json(updatedGoal);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
