/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const { emoji } = await req.json();

    if (!emoji || emoji.length === 0) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    // Check if message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });
    } else {
      // Add reaction
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      });
    }

    // Get updated reactions
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: { user: true },
    });

    return NextResponse.json(
      {
        messageId,
        reactions: reactions.map(r => ({
          emoji: r.emoji,
          userId: r.userId,
          userName: r.user.name,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[Reactions POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 },
    );
  }
}

export async function GET(
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

    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: { user: true },
    });

    // Group reactions by emoji
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          userReacted: false,
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user.name);
      if (reaction.userId === session.user.id) {
        acc[reaction.emoji].userReacted = true;
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(grouped, { status: 200 });
  } catch (error) {
    console.error('[Reactions GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 },
    );
  }
}
