import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
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
      include: { sender: true },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is the sender or conversation participant
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: message.conversationId,
        userId: session.user.id,
      },
    });

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if message is deleted
    if (message.deletedAt) {
      return NextResponse.json(
        { error: 'Cannot pin deleted message' },
        { status: 400 },
      );
    }

    // Toggle pin status
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isPinned: !message.isPinned,
        pinnedAt: !message.isPinned ? new Date() : null,
      },
      include: { sender: true },
    });

    return NextResponse.json(updatedMessage, { status: 200 });
  } catch (error) {
    console.error('[Message PIN] Error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle pin status' },
      { status: 500 },
    );
  }
}
