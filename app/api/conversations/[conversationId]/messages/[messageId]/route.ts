import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ conversationId: string; messageId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { conversationId, messageId } = await params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 },
      );
    }

    // Get message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: true },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is the sender
    if (message.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if message is deleted
    if (message.deletedAt) {
      return NextResponse.json(
        { error: 'Cannot edit deleted message' },
        { status: 400 },
      );
    }

    // Update message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
      include: { sender: true },
    });

    return NextResponse.json(updatedMessage, { status: 200 });
  } catch (error) {
    console.error('[Message PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ conversationId: string; messageId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;

    // Get message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is the sender
    if (message.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete message
    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        content: '[This message was deleted]',
      },
      include: { sender: true },
    });

    return NextResponse.json(deletedMessage, { status: 200 });
  } catch (error) {
    console.error('[Message DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 },
    );
  }
}
