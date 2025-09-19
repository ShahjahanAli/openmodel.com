import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIModel, { IAIModel } from '@/models/AIModel';
import Chat from '@/models/Chat';
import { estimateTokenCount, calculateTokensPerSecond } from '@/lib/tokenCounter';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, modelId, chatId } = body;

    if (!message || !modelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();
    
    // Get the AI model
    const model = await AIModel.findOne({ _id: modelId, userId, isActive: true });
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    let chat;
    if (chatId) {
      // Continue existing chat
      chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
    } else {
      // Create new chat
      chat = new Chat({
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        userId,
        modelId,
        messages: [],
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Measure response time and generate AI response
    const startTime = Date.now();
    const aiResponse = await generateAIResponse(message, model);
    const endTime = Date.now();
    
    // Calculate metrics
    const responseTimeSeconds = (endTime - startTime) / 1000;
    const tokenCount = estimateTokenCount(aiResponse);
    const tokensPerSecond = calculateTokensPerSecond(tokenCount, responseTimeSeconds);
    
    // Add AI response with metrics
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      responseTime: responseTimeSeconds,
      tokenCount: tokenCount,
      tokensPerSecond: tokensPerSecond,
    });

    await chat.save();

    return NextResponse.json({ 
      chat,
      response: aiResponse,
      metrics: {
        responseTime: responseTimeSeconds,
        tokenCount: tokenCount,
        tokensPerSecond: tokensPerSecond
      }
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateAIResponse(message: string, model: IAIModel): Promise<string> {
  try {
    // Handle different AI providers
    if (model.provider === 'openai') {
      return await callOpenAI(message, model);
    } else if (model.provider === 'anthropic') {
      return await callAnthropic(message, model);
    } else if (model.provider === 'google') {
      return await callGoogle(message, model);
    } else if (model.provider === 'custom') {
      return await callLocalAI(message, model);
    }
    
    // Fallback to simulated response
    return await generateSimulatedResponse(message, model);
  } catch (error) {
    console.error('Error generating AI response:', error);
    return `I apologize, but I encountered an error while processing your request. Please check your model configuration and try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function callLocalAI(message: string, model: IAIModel): Promise<string> {
  const endpoint = model.endpoint;
  const apiKey = model.apiKey || '';
  
  if (!endpoint) {
    throw new Error('Endpoint is required for custom models');
  }
  
  // Debug logging
  console.log('Calling local AI with:', {
    endpoint,
    modelId: model.modelId,
    serverType: model.serverType,
    message: message.substring(0, 100) + '...'
  });
  
  // Prepare the request payload based on the server type
  let payload: Record<string, unknown>;
  
  if (endpoint.includes('ollama') || endpoint.includes('/api/generate')) {
    // Ollama API format - uses /api/generate endpoint
    payload = {
      model: model.modelId,
      prompt: message,
      stream: true  // Important: disable streaming to get single response
    };
  } else {
    // OpenAI-compatible API format (LM Studio, Text Generation WebUI)
    payload = {
      model: model.modelId,
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    };
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  
  // Debug logging
  console.log('Sending payload to local AI:', JSON.stringify(payload, null, 2));
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Local AI server responded with status: ${response.status}`);
  }
  
  // Get the raw response text first
  const responseText = await response.text();
  console.log('Raw response from local AI server:', responseText);
  
  let data;
  try {
    // Try to parse as single JSON object first
    data = JSON.parse(responseText);
  } catch {
    // If that fails, it might be a streaming response with multiple JSON objects
    console.log('Single JSON parse failed, trying to parse streaming response...');
    
    // Split by newlines and try to parse each line as JSON
    const lines = responseText.trim().split('\n');
    let accumulatedResponse = '';
    let lastValidResponse = null;
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsedLine = JSON.parse(line);
          if (parsedLine.response) {
            // Accumulate the response text
            accumulatedResponse += parsedLine.response;
            lastValidResponse = parsedLine;
            
            // If this is the final response (done: true), use it
            if (parsedLine.done === true) {
              data = {
                response: accumulatedResponse,
                done: true
              };
              break;
            }
          }
        } catch {
          console.log('Failed to parse line:', line);
        }
      }
    }
    
    if (!data && lastValidResponse) {
      // Use the accumulated response if we have one
      data = {
        response: accumulatedResponse,
        done: true
      };
    } else if (!data) {
      throw new Error('Failed to parse response from local AI server');
    }
  }
  
  // Debug logging
  console.log('Parsed response from local AI server:', JSON.stringify(data, null, 2));
  
  // Handle different response formats
  if (endpoint.includes('ollama') || endpoint.includes('/api/generate')) {
    // Ollama format: { response: "...", done: true }
    if (data.response && data.done === true) {
      return data.response;
    }
    // Handle streaming response (if stream wasn't properly disabled)
    if (data.response && data.done === false) {
      return data.response; // Return partial response
    }
    // Fallback: check for other possible fields
    if (data.message) return data.message;
    if (data.text) return data.text;
    if (data.content) return data.content;
    if (typeof data === 'string') return data;
    return 'No response from Ollama';
  } else {
    // OpenAI-compatible format: { choices: [{ message: { content: "..." } }] }
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    // Fallback: check for other possible fields
    if (data.message) return data.message;
    if (data.text) return data.text;
    if (data.content) return data.content;
    if (data.response) return data.response;
    if (typeof data === 'string') return data;
    return 'No response from local AI server';
  }
}

async function callOpenAI(message: string, model: IAIModel): Promise<string> {
  const apiKey = model.apiKey;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  // Debug logging
  console.log('Calling OpenAI with:', {
    model: model.modelId,
    message: message.substring(0, 100) + '...'
  });

  const payload = {
    model: model.modelId,
    messages: [
      {
        role: 'user',
        content: message
      }
    ],
    max_tokens: 2000,
    temperature: 0.7,
    stream: false
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  // Debug logging
  console.log('Sending payload to OpenAI:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Debug logging
    console.log('OpenAI response:', JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from OpenAI API');
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

async function callAnthropic(message: string, model: IAIModel): Promise<string> {
  // TODO: Implement Anthropic API call
  return await generateSimulatedResponse(message, model);
}

async function callGoogle(message: string, model: IAIModel): Promise<string> {
  // TODO: Implement Google API call
  return await generateSimulatedResponse(message, model);
}

async function generateSimulatedResponse(message: string, model: IAIModel): Promise<string> {
  const responses = [
    "I understand your question. Let me help you with that.",
    "That's an interesting point. Here's what I think about it:",
    "I can definitely help you with that. Let me provide some insights:",
    "Great question! Here's my response:",
    "I'd be happy to assist you with that. Here's what I suggest:",
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const providerInfo = model.provider === 'custom' ? 
    `local ${model.serverType || 'AI'} server` : 
    `${model.provider} API`;
  
  return `${randomResponse}\n\nRegarding "${message}", I can provide you with detailed information and assistance. This is a simulated response from the ${model.name} model (${providerInfo}). In a real implementation, this would be an actual AI-generated response based on your specific model configuration.`;
}
