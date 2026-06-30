import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export async function POST(request, { params }) {
  try {
    const { action } = await params;
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userRef = doc(db, 'users', normalizedEmail);
    const userSnap = await getDoc(userRef);
    const existingUser = userSnap.exists() ? userSnap.data() : null;

    if (action === 'signup') {
      if (existingUser) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
      }
      
      const newUser = { 
        email: normalizedEmail, 
        password, 
        name: name || normalizedEmail.split('@')[0] 
      };
      
      await setDoc(userRef, newUser);
      
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
      
      await updateDoc(userRef, { password });
      
      return NextResponse.json({ message: 'Password reset successful' });
    }

    return NextResponse.json({ error: 'Invalid auth action' }, { status: 400 });

  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
