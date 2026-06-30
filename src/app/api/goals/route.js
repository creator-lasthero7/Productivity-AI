import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

const getUserEmail = (req) => req.headers.get('x-user-email');

export async function GET(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const q = query(collection(db, 'goals'), where('userEmail', '==', userEmail));
    const snapshot = await getDocs(q);
    const userGoals = snapshot.docs.map(doc => doc.data());
    
    return NextResponse.json(userGoals);
  } catch (error) {
    console.error('GET Goals Error:', error);
    return NextResponse.json({ error: 'Failed to read goals' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const goal = await request.json();
    
    const id = Date.now();
    const newGoal = {
      ...goal,
      userEmail,
      id,
      progress: 0,
      milestones: goal.milestones || []
    };
    
    await setDoc(doc(db, 'goals', id.toString()), newGoal);
    
    return NextResponse.json(newGoal);
  } catch (error) {
    console.error('POST Goal Error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, ...updatedFields } = await request.json();
    
    const goalRef = doc(db, 'goals', id.toString());
    await updateDoc(goalRef, updatedFields);
    
    return NextResponse.json({ id, userEmail, ...updatedFields });
  } catch (error) {
    console.error('PUT Goal Error:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
