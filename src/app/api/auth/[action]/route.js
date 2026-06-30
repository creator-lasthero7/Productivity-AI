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

export async function POST(request, { params }) {
  try {
    const { action } = await params;
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = await getDbData();
    if (!db.users) db.users = [];

    const existingUserIndex = db.users.findIndex(u => u.email === normalizedEmail);
    const existingUser = existingUserIndex !== -1 ? db.users[existingUserIndex] : null;

    if (action === 'signup') {
      if (existingUser) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
      }
      
      const newUser = { 
        email: normalizedEmail, 
        password, 
        name: name || normalizedEmail.split('@')[0] 
      };
      db.users.push(newUser);
      await writeDbData(db);
      
      return NextResponse.json({ 
        message: 'Signup successful', 
        user: { email: newUser.email, name: newUser.name } 
      });
    } 
    
    if (action === 'login') {
      if (!existingUser) {
        return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
      }
      
      if (existingUser.password !== password) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }

      return NextResponse.json({ 
        message: 'Login successful', 
        user: { email: existingUser.email, name: existingUser.name } 
      });
    }

    if (action === 'reset') {
      if (!existingUser) {
        return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
      }
      
      // Update password
      db.users[existingUserIndex].password = password;
      await writeDbData(db);
      
      return NextResponse.json({ message: 'Password reset successful' });
    }

    return NextResponse.json({ error: 'Invalid auth action' }, { status: 400 });

  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

