import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { buildFamilyGraph } from '../services/graphService';
import { RelationshipType } from '@prisma/client';

export const suggestionsRouter = Router();
suggestionsRouter.use(authenticate);

// ─────────────────────────────────────────────
// Human-readable path label builder
// Used for AI explanation: "Your father's brother's son"
// ─────────────────────────────────────────────

function buildPathDescription(
  graph: Awaited<ReturnType<typeof buildFamilyGraph>>,
  pathNodeIds: string[],
  sourceId: string,
): string {
  if (pathNodeIds.length < 2) return '';

  // Reconstruct edge labels along the path
  const labels: string[] = [];
  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const from = pathNodeIds[i];
    const to = pathNodeIds[i + 1];
    const neighbors = graph.adjacency.get(from) || [];
    const conn = neighbors.find(n => n.targetId === to);
    if (conn) {
      labels.push(conn.edge.relationshipType.toLowerCase());
    }
  }

  if (labels.length === 0) return 'Related via family network';

  // Build "Your X's Y's Z" description
  let desc = "Your " + labels[0];
  for (let i = 1; i < labels.length; i++) {
    desc += `'s ${labels[i]}`;
  }
  return desc;
}

// Simple mapping of edge path to relationship label
function deriveLabel(labels: string[]): string {
  const t = labels.map(l => l.toUpperCase());
  if (t.length === 1) return capitalize(t[0]);
  if (t.length === 2) {
    if ((t[0] === 'FATHER' || t[0] === 'MOTHER') && (t[1] === 'BROTHER' || t[1] === 'SISTER'))
      return t[1] === 'BROTHER' ? 'Uncle' : 'Aunt';
    if ((t[0] === 'UNCLE' || t[0] === 'AUNT') && (t[1] === 'SON' || t[1] === 'DAUGHTER'))
      return 'Cousin';
    if ((t[0] === 'FATHER' || t[0] === 'MOTHER') && (t[1] === 'FATHER' || t[1] === 'MOTHER'))
      return 'Grandparent';
    if ((t[0] === 'SON' || t[0] === 'DAUGHTER') && (t[1] === 'BROTHER' || t[1] === 'SISTER'))
      return 'Sibling-in-law';
  }
  if (t.length === 3) {
    if ((t[0] === 'FATHER' || t[0] === 'MOTHER') &&
        (t[1] === 'BROTHER' || t[1] === 'SISTER') &&
        (t[2] === 'SON' || t[2] === 'DAUGHTER'))
      return 'Cousin';
    if ((t[0] === 'FATHER' || t[0] === 'MOTHER') &&
        (t[1] === 'FATHER' || t[1] === 'MOTHER') &&
        (t[2] === 'BROTHER' || t[2] === 'SISTER'))
      return 'Grand Uncle/Aunt';
  }
  if (t.length === 4) return '2nd Cousin or Extended Family';
  return 'Extended Family Member';
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

// ── GET /suggestions ──────────────────────────
// Return up to 10 family member suggestions based on graph proximity
suggestionsRouter.get('/', async (req: AuthRequest, res) => {
  const userId = req.userId!;

  // Build graph up to depth 4 for suggestions
  const graph = await buildFamilyGraph(userId, 4);

  // Get direct connections (depth 1) — these should NOT be suggested
  const directNeighborIds = new Set<string>(
    (graph.adjacency.get(userId) || []).map(n => n.targetId)
  );
  directNeighborIds.add(userId); // exclude self

  // BFS to find all reachable nodes with their shortest path
  const visited = new Map<string, { depth: number; pathIds: string[] }>();
  visited.set(userId, { depth: 0, pathIds: [userId] });
  const queue: string[] = [userId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentData = visited.get(current)!;
    if (currentData.depth >= 4) continue;

    const neighbors = graph.adjacency.get(current) || [];
    for (const { targetId } of neighbors) {
      if (!visited.has(targetId)) {
        visited.set(targetId, {
          depth: currentData.depth + 1,
          pathIds: [...currentData.pathIds, targetId],
        });
        queue.push(targetId);
      }
    }
  }

  // Filter: 2+ hops away, not direct, not self, only REAL accounts preferred
  const candidates = Array.from(visited.entries())
    .filter(([id, data]) => !directNeighborIds.has(id) && data.depth >= 2)
    .sort((a, b) => a[1].depth - b[1].depth) // closer = higher priority
    .slice(0, 15);

  // Enrich with user data
  const suggestions = await Promise.all(
    candidates.map(async ([candidateId, data]) => {
      const node = graph.nodes.get(candidateId);
      if (!node) return null;

      // Build edge label chain along path
      const path = data.pathIds;
      const edgeLabels: string[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        const neighbors = graph.adjacency.get(from) || [];
        const conn = neighbors.find(n => n.targetId === to);
        if (conn) edgeLabels.push(conn.edge.relationshipType.toLowerCase());
      }

      const pathDescription = buildPathDescription(graph, path, userId);
      const relationshipLabel = deriveLabel(edgeLabels);

      // The intermediate node names for the "Why" explanation
      const pathNames = path
        .slice(1, -1) // exclude self and candidate
        .map(id => graph.nodes.get(id)?.name)
        .filter(Boolean);

      return {
        userId: candidateId,
        name: node.name,
        familySurname: node.familySurname,
        accountType: node.accountType,
        hopsAway: data.depth,
        relationshipLabel,
        pathDescription,
        pathNames,
        pathNodeIds: path,
      };
    })
  );

  const valid = suggestions.filter(Boolean).slice(0, 10);
  res.json({ success: true, data: valid });
});
