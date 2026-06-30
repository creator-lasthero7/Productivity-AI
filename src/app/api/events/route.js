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
    const userEvents = (db.events || []).filter(e => e.userEmail === userEmail);
    
    return NextResponse.json(userEvents);
  } catch (error) {
    console.error('GET Events Error:', error);
    return NextResponse.json({ error: 'Failed to read events' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const event = await request.json();
    
    const id = Date.now();
    const newEvent = {
      ...event,
      userEmail,
      id
    };
    
    const db = await getDbData();
    if (!db.events) db.events = [];
    db.events.push(newEvent);
    await writeDbData(db);
    
    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('POST Event Error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

