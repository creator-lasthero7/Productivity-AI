import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const getUserEmail = (req) => req.headers.get('x-user-email');

export async function GET(request) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const q = query(collection(db, 'tasks'), where('userEmail', '==', userEmail));
    const snapshot = await getDocs(q);
    const userTasks = snapshot.docs.map(doc => doc.data());
    
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
    
    await setDoc(doc(db, 'tasks', id.toString()), newTask);
    
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
    
    const taskRef = doc(db, 'tasks', id.toString());
    await updateDoc(taskRef, updatedFields);
    
    return NextResponse.json({ id, userEmail, ...updatedFields });
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
    const id = searchParams.get('id');
    
    await deleteDoc(doc(db, 'tasks', id.toString()));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Task Error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
