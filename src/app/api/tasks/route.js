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
    const userTasks = db.tasks.filter(t => t.userEmail === userEmail);
    return NextResponse.json(userTasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read tasks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const task = await request.json();
    const db = readDb();
    
    const newTask = {
      ...task,
      userEmail,
      id: Date.now(),
      done: false,
      subtasks: task.subtasks || []
    };
    
    db.tasks.unshift(newTask);
    writeDb(db);
    
    return NextResponse.json(newTask);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, ...updatedFields } = await request.json();
    const db = readDb();
    
    let updatedTask = null;
    db.tasks = db.tasks.map((t) => {
      if (t.id === id && t.userEmail === userEmail) {
        updatedTask = { ...t, ...updatedFields };
        return updatedTask;
      }
      return t;
    });
    
    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    writeDb(db);
    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    const db = readDb();
    
    const initialLength = db.tasks.length;
    db.tasks = db.tasks.filter((t) => !(t.id === id && t.userEmail === userEmail));
    
    if (db.tasks.length === initialLength) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    writeDb(db);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
