import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

const getUserEmail = (req) => req.headers.get('x-user-email');

export async function GET(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const q = query(collection(db, 'events'), where('userEmail', '==', userEmail));
    const snapshot = await getDocs(q);
    const userEvents = snapshot.docs.map(doc => doc.data());
    
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
    
    await setDoc(doc(db, 'events', id.toString()), newEvent);
    
    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('POST Event Error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
