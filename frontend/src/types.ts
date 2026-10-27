export type RelationshipType =
  | 'FATHER' | 'MOTHER' | 'PARENT'
  | 'SON' | 'DAUGHTER'
  | 'BROTHER' | 'SISTER'
  | 'UNCLE' | 'AUNT'
  | 'GRANDFATHER' | 'GRANDMOTHER'
  | 'SPOUSE' | 'HUSBAND' | 'WIFE';

export type RelationshipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'VERIFIED' | 'DISPUTED';

export type AccountType = 'REAL' | 'DUMMY';

export type NotificationType =
  | 'RELATIONSHIP_REQUEST'
  | 'REQUEST_ACCEPTED'
  | 'REQUEST_REJECTED'
  | 'RELATIONSHIP_VERIFIED'
  | 'RELATIONSHIP_DISPUTED'
  | 'DUMMY_PROFILE_CLAIMED'
  | 'RELATIONSHIP_STATUS_UPDATE'
  | 'EVENT_INVITATION'
  | 'EVENT_RSVP_UPDATE';

export type TimelineEntryType = 'POST' | 'MILESTONE' | 'EVENT_MEMORY';
export type TimelineVisibility = 'FAMILY' | 'PUBLIC';
export type RsvpStatus = 'PENDING' | 'GOING' | 'INTERESTED' | 'CANT_GO';

export interface User {
  id: string;
  name: string;
  email: string | null;
  regionOfOrigin?: string | null;
  motherTongue?: string | null;
  familySurname?: string | null;
  surnameOrigin?: string | null;
  casteSubcaste?: string | null;
  accountType: AccountType;
  accountState: 'ACTIVE' | 'INACTIVE' | 'CLAIMED';
  createdAt?: string;
}

export interface Relationship {
  id: string;
  userId: string;
  relatedUserId: string;
  relationshipType: RelationshipType;
  status: RelationshipStatus;
  relatedUser: Pick<User, 'id' | 'name' | 'familySurname' | 'accountType'>;
}

export interface RelationshipRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  relationshipType: RelationshipType;
  status: RelationshipStatus;
  message?: string;
  requester: Pick<User, 'id' | 'name' | 'familySurname'>;
  recipient: Pick<User, 'id' | 'name' | 'familySurname'>;
}

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityId?: string;
  entityType?: string;
  read: boolean;
  createdAt: string;
}

export interface PathResult {
  sourceUser: { id: string; name: string };
  targetUser: { id: string; name: string };
  nodes: Array<{
    id: string;
    name: string;
    familySurname?: string | null;
    accountType: string;
    isRoot: boolean;
  }>;
  relationships: Array<{
    id: string;
    sourceId: string;
    targetId: string;
    relationshipType: RelationshipType;
    status: string;
  }>;
  relationshipLabel: string;
  pathStatus: 'FOUND' | 'NOT_FOUND';
}

// ── Phase 3 Types ────────────────────────────

export interface TimelineEntry {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string | null;
  entryType: TimelineEntryType;
  title?: string | null;
  eventDate?: string | null;
  visibility: TimelineVisibility;
  taggedUserIds: string[];
  familyEventId?: string | null;
  familyEvent?: { id: string; title: string; eventDate: string; location?: string | null } | null;
  hasLiked: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    familySurname?: string | null;
    accountType: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    accountType: string;
  };
}

export interface EventInvitee {
  id: string;
  userId: string;
  rsvpStatus: RsvpStatus;
  user: Pick<User, 'id' | 'name' | 'familySurname'>;
}

export interface FamilyEvent {
  id: string;
  hostId: string;
  title: string;
  eventDate: string;
  eventTime?: string | null;
  location?: string | null;
  description?: string | null;
  createdAt: string;
  host: Pick<User, 'id' | 'name' | 'familySurname'>;
  invitees: EventInvitee[];
  myRsvp: RsvpStatus | 'GOING' | null;
  rsvpCounts: {
    GOING: number;
    INTERESTED: number;
    CANT_GO: number;
    PENDING: number;
  };
  _count?: { invitees: number; timelinePosts: number };
}

export interface FamilySuggestion {
  userId: string;
  name: string;
  familySurname?: string | null;
  accountType: string;
  hopsAway: number;
  relationshipLabel: string;
  pathDescription: string;
  pathNames: string[];
  pathNodeIds: string[];
}
