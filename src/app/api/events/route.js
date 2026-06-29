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
    const userEvents = db.events.filter(e => e.userEmail === userEmail);
    return NextResponse.json(userEvents);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read events' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const event = await request.json();
    const db = readDb();
    
    const newEvent = {
      ...event,
      userEmail,
      id: Date.now()
    };
    
    db.events.push(newEvent);
    writeDb(db);
    
    return NextResponse.json(newEvent);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
