import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIModel from '@/models/AIModel';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const model = await AIModel.findOne({ _id: params.id, userId });
    
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    
    return NextResponse.json({ model });
  } catch (error) {
    console.error('Error fetching model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, provider, modelId, apiKey, endpoint, isActive } = body;

    await connectDB();
    const model = await AIModel.findOneAndUpdate(
      { _id: params.id, userId },
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(provider && { provider }),
        ...(modelId && { modelId }),
        ...(apiKey && { apiKey }),
        ...(endpoint && { endpoint }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true }
    );
    
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    
    return NextResponse.json({ model });
  } catch (error) {
    console.error('Error updating model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const model = await AIModel.findOneAndUpdate(
      { _id: params.id, userId },
      { isActive: false },
      { new: true }
    );
    
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
