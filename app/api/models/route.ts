import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIModel from '@/models/AIModel';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const models = await AIModel.find({ userId, isActive: true });
    
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, provider, modelId, apiKey, endpoint, serverType } = body;

    if (!name || !provider || !modelId) {
      return NextResponse.json({ error: 'Missing required fields: name, provider, and modelId are required' }, { status: 400 });
    }

    // Validate custom provider requirements
    if (provider === 'custom' && !endpoint) {
      return NextResponse.json({ error: 'Endpoint URL is required for custom providers' }, { status: 400 });
    }

    await connectDB();
    
    const model = new AIModel({
      name,
      description: description || '',
      provider,
      modelId,
      apiKey: apiKey || undefined,
      endpoint: endpoint || undefined,
      serverType: serverType || undefined,
      userId,
      isActive: true,
      createdAt: new Date(),
    });

    await model.save();
    
    return NextResponse.json({ model }, { status: 201 });
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
