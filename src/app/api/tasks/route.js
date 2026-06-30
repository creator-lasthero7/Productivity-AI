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
    const userTasks = (db.tasks || []).filter(t => t.userEmail === userEmail);
    
    // Sort tasks by id (timestamp) descending to match original behavior
    userTasks.sort((a, b) => b.id - a.id);
    
    return NextResponse.json(userTasks);
  } catch (error) {
    console.error('GET Tasks Error:', error);
    return NextResponse.json({ error: 'Failed to read tasks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const task = await request.json();
    
    const id = Date.now();
    const newTask = {
      ...task,
      userEmail,
      id,
      done: false,
      subtasks: task.subtasks || []
    };
    
    const db = await getDbData();
    if (!db.tasks) db.tasks = [];
    db.tasks.push(newTask);
    await writeDbData(db);
    
    return NextResponse.json(newTask);
  } catch (error) {
    console.error('POST Task Error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, ...updatedFields } = await request.json();
    
    const db = await getDbData();
    if (!db.tasks) db.tasks = [];
    
    const index = db.tasks.findIndex(t => t.id === id && t.userEmail === userEmail);
    if (index === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    db.tasks[index] = { ...db.tasks[index], ...updatedFields };
    await writeDbData(db);
    
    return NextResponse.json(db.tasks[index]);
  } catch (error) {
    console.error('PUT Task Error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    
    const db = await getDbData();
    if (!db.tasks) db.tasks = [];
    
    const index = db.tasks.findIndex(t => t.id === id && t.userEmail === userEmail);
    if (index === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    db.tasks.splice(index, 1);
    await writeDbData(db);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Task Error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}

