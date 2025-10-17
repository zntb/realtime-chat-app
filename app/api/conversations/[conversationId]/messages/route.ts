// app/api/conversations/[conversationId]/messages/route.ts
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: session.user.id,
      },
    });

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      include: {
        sender: true,
        quotedMessage: {
          include: { sender: true }, // NEW: Include quoted message details
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Transform messages to format quoted message data
    const formattedMessages = messages.map(msg => ({
      ...msg,
      quotedMessage: msg.quotedMessage
        ? {
            id: msg.quotedMessage.id,
            content: msg.quotedMessage.content,
            senderName: msg.quotedMessage.sender.name || 'Unknown',
            senderId: msg.quotedMessage.senderId,
          }
        : null,
    }));

    return NextResponse.json(formattedMessages, { status: 200 });
  } catch (error) {
    console.error('[Messages GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    // Check if user is participant
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: session.user.id,
      },
    });

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type');

    let content: string;
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;
    let quotedMessageId: string | null = null;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const caption = formData.get('caption') as string;
      quotedMessageId = (formData.get('quotedMessageId') as string) || null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 },
        );
      }

      content = caption || `Shared ${file.name}`;
      fileName = file.name;
      fileType = file.type;
      fileUrl = URL.createObjectURL(file);
    } else {
      const body = await req.json();
      content = body.content;
      quotedMessageId = body.quotedMessageId || null;

      if (!content?.trim()) {
        return NextResponse.json(
          { error: 'Message content is required' },
          { status: 400 },
        );
      }
    }

    // Validate quoted message if provided
    if (quotedMessageId) {
      const quotedMsg = await prisma.message.findUnique({
        where: { id: quotedMessageId },
        include: { sender: true },
      });

      if (!quotedMsg) {
        return NextResponse.json(
          { error: 'Quoted message not found' },
          { status: 404 },
        );
      }
    }

    // Create message with quotedMessageId
    const message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: session.user.id,
        fileUrl,
        fileName,
        fileType,
        quotedMessageId, // NEW: Add quoted message reference
      },
      include: {
        sender: true,
        quotedMessage: {
          include: { sender: true },
        },
      },
    });

    // Transform response to include formatted quoted message
    const responseMessage = {
      ...message,
      quotedMessage: message.quotedMessage
        ? {
            id: message.quotedMessage.id,
            content: message.quotedMessage.content,
            senderName: message.quotedMessage.sender.name || 'Unknown',
            senderId: message.quotedMessage.senderId,
          }
        : null,
    };

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(responseMessage, { status: 201 });
  } catch (error) {
    console.error('[Messages POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 },
    );
  }
}
