import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

const getUserEmail = (req) => req.headers.get('x-user-email');

export async function GET(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const q = query(collection(db, 'habits'), where('userEmail', '==', userEmail));
    const snapshot = await getDocs(q);
    const userHabits = snapshot.docs.map(doc => doc.data());
    
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
    
    await setDoc(doc(db, 'habits', id.toString()), newHabit);
    
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
    
    const habitRef = doc(db, 'habits', id.toString());
    await updateDoc(habitRef, updatedFields);
    
    return NextResponse.json({ id, userEmail, ...updatedFields });
  } catch (error) {
    console.error('PUT Habit Error:', error);
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}
