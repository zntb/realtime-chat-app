import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, participants, isGroup } = await req.json();

    // Validate input
    if (!participants || participants.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant is required' },
        { status: 400 },
      );
    }

    // Fetch users by email to get their IDs
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: participants,
        },
      },
    });

    // Check if all provided emails exist
    if (users.length !== participants.length) {
      const foundEmails = users.map(u => u.email);
      const missingEmails = participants.filter(
        (e: string) => !foundEmails.includes(e),
      );
      return NextResponse.json(
        { error: `User(s) not found: ${missingEmails.join(', ')}` },
        { status: 404 },
      );
    }

    // Ensure current user is included
    const userIds = users.map(u => u.id);
    const allParticipants = Array.from(new Set([session.user.id, ...userIds]));

    // Check if direct message already exists (for 1-on-1 chats)
    if (!isGroup && allParticipants.length === 2) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: allParticipants.map(userId => ({
            participants: {
              some: {
                userId,
              },
            },
          })),
        },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (existingConversation?.participants.length === 2) {
        return NextResponse.json(existingConversation, { status: 200 });
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        name: isGroup ? name : null,
        isGroup: isGroup || false,
        participants: {
          create: allParticipants.map(userId => ({
            userId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('[Conversations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(conversations, { status: 200 });
  } catch (error) {
    console.error('[Conversations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 },
    );
  }
}
