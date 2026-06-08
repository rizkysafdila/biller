import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import { userDataTag } from "./cache";
import { colorForName } from "./colors";
import {
  computeSessionSettlement,
  type SessionInput,
  type SessionSettlement,
} from "@/domain/settlement";

export interface ParticipantView {
  id: string; // SessionParticipant id
  friendId: string;
  name: string;
  avatarColor: string;
  isOwner: boolean;
}

export interface BillItemView {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  participantIds: string[];
}

export interface BillView {
  id: string;
  merchantName: string;
  paidById: string | null;
  taxAmount: number;
  serviceAmount: number;
  discountAmount: number;
  receiptImageUrl: string | null;
  items: BillItemView[];
}

export interface SessionView {
  id: string;
  title: string;
  date: Date;
  note: string | null;
  shareToken: string | null;
  participants: ParticipantView[];
  bills: BillView[];
  settlement: SessionSettlement;
}

const includeShape = {
  participants: {
    include: { friend: true },
    orderBy: { createdAt: "asc" as const },
  },
  bills: {
    orderBy: { createdAt: "asc" as const },
    include: {
      items: {
        orderBy: { position: "asc" as const },
        include: { shares: true },
      },
    },
  },
};

type RawSession = NonNullable<
  Awaited<ReturnType<typeof db.session.findFirst>>
>;

function toView(session: RawSession & Record<string, unknown>): SessionView {
  // The `as` casts narrow the included relations that Prisma's base type omits.
  const raw = session as unknown as {
    id: string;
    title: string;
    date: Date;
    note: string | null;
    shareToken: string | null;
    participants: {
      id: string;
      friendId: string;
      friend: { name: string; avatarColor: string | null; isOwner: boolean };
    }[];
    bills: {
      id: string;
      merchantName: string;
      paidById: string | null;
      taxAmount: number;
      serviceAmount: number;
      discountAmount: number;
      receiptImageUrl: string | null;
      items: {
        id: string;
        name: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        shares: { participantId: string }[];
      }[];
    }[];
  };

  const participants: ParticipantView[] = raw.participants.map((p) => ({
    id: p.id,
    friendId: p.friendId,
    name: p.friend.name,
    avatarColor: p.friend.avatarColor ?? colorForName(p.friend.name),
    isOwner: p.friend.isOwner,
  }));

  const bills: BillView[] = raw.bills.map((b) => ({
    id: b.id,
    merchantName: b.merchantName,
    paidById: b.paidById,
    taxAmount: b.taxAmount,
    serviceAmount: b.serviceAmount,
    discountAmount: b.discountAmount,
    receiptImageUrl: b.receiptImageUrl,
    items: b.items.map((it) => ({
      id: it.id,
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
      participantIds: it.shares.map((s) => s.participantId),
    })),
  }));

  const settlementInput: SessionInput = {
    participantIds: participants.map((p) => p.id),
    bills: bills.map((b) => ({
      id: b.id,
      payerId: b.paidById,
      taxAmount: b.taxAmount,
      serviceAmount: b.serviceAmount,
      discountAmount: b.discountAmount,
      items: b.items.map((it) => ({
        id: it.id,
        lineTotal: it.lineTotal,
        shares: it.participantIds.map((participantId) => ({
          participantId,
          weight: 1,
        })),
      })),
    })),
  };

  return {
    id: raw.id,
    title: raw.title,
    date: raw.date,
    note: raw.note,
    shareToken: raw.shareToken,
    participants,
    bills,
    settlement: computeSessionSettlement(settlementInput),
  };
}

/** Load a session owned by `userId`, with settlement computed (cached). */
export function getSessionView(
  sessionId: string,
  userId: string,
): Promise<SessionView | null> {
  return unstable_cache(
    async () => {
      const session = await db.session.findFirst({
        where: { id: sessionId, userId },
        include: includeShape,
      });
      return session ? toView(session) : null;
    },
    ["session-view", sessionId, userId],
    { tags: [userDataTag(userId), `session:${sessionId}`], revalidate: 3600 },
  )();
}

/** Load every session owned by `userId`, each with settlement computed. */
export async function getAllSessionViews(userId: string): Promise<SessionView[]> {
  const sessions = await db.session.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: includeShape,
  });
  return sessions.map(toView);
}

/** Load a session by its public share token (no auth), with settlement. */
export async function getSharedSessionView(
  token: string,
): Promise<SessionView | null> {
  const session = await db.session.findFirst({
    where: { shareToken: token },
    include: includeShape,
  });
  return session ? toView(session) : null;
}
