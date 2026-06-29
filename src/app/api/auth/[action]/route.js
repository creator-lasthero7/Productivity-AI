import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getDbPath = () => path.join(process.cwd(), 'src', 'data', 'db.json');

const readDb = () => {
  const filePath = getDbPath();
  const fileData = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(fileData);
  // Ensure users array exists
  if (!parsed.users) {
    parsed.users = [];
  }
  return parsed;
};

const writeDb = (data) => {
  const filePath = getDbPath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

export async function POST(request, { params }) {
  try {
    const { action } = await params;
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const db = readDb();
    const existingUser = db.users.find(u => u.email === email);

    if (action === 'signup') {
      if (existingUser) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
      }
      
      const newUser = { email, password, name: name || email.split('@')[0] };
      db.users.push(newUser);
      writeDb(db);
      
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
      existingUser.password = password;
      writeDb(db);
      
      return NextResponse.json({ message: 'Password reset successful' });
    }

    return NextResponse.json({ error: 'Invalid auth action' }, { status: 400 });

  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
