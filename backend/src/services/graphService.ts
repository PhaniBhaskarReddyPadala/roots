import { Relationship, RelationshipType, User } from '@prisma/client';
import { prisma } from '../lib/prisma';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface GraphNode {
  id: string;
  name: string;
  familySurname?: string | null;
  accountType: string;
  accountState: string;
  isRoot: boolean;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: RelationshipType;
  status: string;
}

export interface FamilyGraph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  adjacency: Map<string, { targetId: string; edge: GraphEdge }[]>;
}

// ─────────────────────────────────────────────
// Build Family Graph (BFS from root user)
// ─────────────────────────────────────────────

export async function buildFamilyGraph(
  rootUserId: string,
  maxDepth = 6,
): Promise<FamilyGraph> {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const edgeIds = new Set<string>();
  const adjacency = new Map<string, { targetId: string; edge: GraphEdge }[]>();
  const visited = new Set<string>();
  const queue: { userId: string; depth: number }[] = [{ userId: rootUserId, depth: 0 }];

  while (queue.length > 0) {
    const { userId, depth } = queue.shift()!;

    if (visited.has(userId) || depth > maxDepth) continue;
    visited.add(userId);

    // Fetch user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, familySurname: true, accountType: true, accountState: true },
    });

    if (!user) continue;

    nodes.set(user.id, {
      id: user.id,
      name: user.name,
      familySurname: user.familySurname,
      accountType: user.accountType,
      accountState: user.accountState,
      isRoot: userId === rootUserId,
    });

    // Fetch ALL relationships involving this user (both as source and target)
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { userId, status: { in: ['ACCEPTED', 'VERIFIED', 'DISPUTED'] } },
          { relatedUserId: userId, status: { in: ['ACCEPTED', 'VERIFIED', 'DISPUTED'] } },
        ],
      },
    });

    for (const rel of relationships) {
      const edge: GraphEdge = {
        id: rel.id,
        sourceId: rel.userId,
        targetId: rel.relatedUserId,
        relationshipType: rel.relationshipType,
        status: rel.status,
      };

      // Avoid duplicate edges
      if (!edgeIds.has(edge.id)) {
        edgeIds.add(edge.id);
        edges.push(edge);

        // Build adjacency for both directions so BFS can traverse the full graph
        if (!adjacency.has(rel.userId)) adjacency.set(rel.userId, []);
        adjacency.get(rel.userId)!.push({ targetId: rel.relatedUserId, edge });

        if (!adjacency.has(rel.relatedUserId)) adjacency.set(rel.relatedUserId, []);
        adjacency.get(rel.relatedUserId)!.push({ targetId: rel.userId, edge });
      }

      // Enqueue both ends
      const otherId = rel.userId === userId ? rel.relatedUserId : rel.userId;
      if (!visited.has(otherId)) {
        queue.push({ userId: otherId, depth: depth + 1 });
      }
    }
  }

  return { nodes, edges, adjacency };
}

// ─────────────────────────────────────────────
// BFS: Find relationship path between two nodes
// ─────────────────────────────────────────────

export interface PathResult {
  sourceUser: { id: string; name: string };
  targetUser: { id: string; name: string };
  nodes: GraphNode[];
  relationships: GraphEdge[];
  relationshipLabel: string;
  pathStatus: 'FOUND' | 'NOT_FOUND';
}

export function findRelationshipPath(
  graph: FamilyGraph,
  sourceId: string,
  targetId: string,
): PathResult | null {
  if (!graph.nodes.has(sourceId) || !graph.nodes.has(targetId)) return null;

  // BFS
  const prev = new Map<string, { nodeId: string; edge: GraphEdge } | null>();
  const queue: string[] = [sourceId];
  prev.set(sourceId, null);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetId) break;

    const neighbors = graph.adjacency.get(current) || [];
    for (const { targetId: neighborId, edge } of neighbors) {
      if (!prev.has(neighborId)) {
        prev.set(neighborId, { nodeId: current, edge });
        queue.push(neighborId);
      }
    }
  }

  if (!prev.has(targetId)) return null;

  // Reconstruct path
  const pathNodes: GraphNode[] = [];
  const pathEdges: GraphEdge[] = [];

  let current = targetId;
  while (current !== sourceId) {
    const p = prev.get(current)!;
    pathNodes.unshift(graph.nodes.get(current)!);
    pathEdges.unshift(p.edge);
    current = p.nodeId;
  }
  pathNodes.unshift(graph.nodes.get(sourceId)!);

  const relationshipLabel = deriveRelationshipLabel(pathEdges);

  return {
    sourceUser: { id: sourceId, name: graph.nodes.get(sourceId)!.name },
    targetUser: { id: targetId, name: graph.nodes.get(targetId)!.name },
    nodes: pathNodes,
    relationships: pathEdges,
    relationshipLabel,
    pathStatus: 'FOUND',
  };
}

// ─────────────────────────────────────────────
// Derive human-readable relationship label
// ─────────────────────────────────────────────

function deriveRelationshipLabel(edges: GraphEdge[]): string {
  if (edges.length === 0) return 'Same person';
  if (edges.length === 1) {
    return capitalizeFirst(edges[0].relationshipType.toLowerCase());
  }

  const types = edges.map(e => e.relationshipType);

  // 2-hop patterns
  if (types.length === 2) {
    const [t1, t2] = types;

    // Parent → Sibling = Uncle/Aunt
    if ((t1 === 'FATHER' || t1 === 'MOTHER') && (t2 === 'BROTHER' || t2 === 'SISTER')) {
      return t2 === 'BROTHER' ? 'Uncle' : 'Aunt';
    }

    // Sibling → Child = Nephew/Niece
    if ((t1 === 'BROTHER' || t1 === 'SISTER') && (t2 === 'SON' || t2 === 'DAUGHTER')) {
      return t2 === 'SON' ? 'Nephew' : 'Niece';
    }

    // Grandparent patterns
    if ((t1 === 'FATHER' || t1 === 'MOTHER') && (t2 === 'FATHER' || t2 === 'MOTHER')) {
      return t2 === 'FATHER' ? 'Paternal Grandfather' : 'Paternal Grandmother';
    }

    // Uncle/Aunt child = Cousin
    if ((t1 === 'UNCLE' || t1 === 'AUNT') && (t2 === 'SON' || t2 === 'DAUGHTER')) {
      return 'Cousin';
    }
  }

  // 3-hop cousin patterns
  if (types.length === 3) {
    const [t1, t2, t3] = types;
    if (
      (t1 === 'FATHER' || t1 === 'MOTHER') &&
      (t2 === 'BROTHER' || t2 === 'SISTER') &&
      (t3 === 'SON' || t3 === 'DAUGHTER')
    ) {
      return 'Cousin';
    }
  }

  // Fallback: chain description
  return types.map(t => capitalizeFirst(t.toLowerCase())).join(' → ');
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─────────────────────────────────────────────
// Convert graph to React Flow nodes/edges format
// ─────────────────────────────────────────────

export function graphToNodes(graph: FamilyGraph, rootUserId: string) {
  const nodes = Array.from(graph.nodes.values()).map((node, i) => ({
    id: node.id,
    type: 'familyNode',
    position: { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 },
    data: {
      label: node.name,
      surname: node.familySurname,
      accountType: node.accountType,
      isRoot: node.isRoot,
    },
  }));

  // Deduplicate edges: keep only one edge per user pair
  // (bidirectional relationship rows create two edges like Father & Son for the same pair)
  const pairSeen = new Set<string>();
  const uniqueEdges: GraphEdge[] = [];
  for (const edge of graph.edges) {
    const key = [edge.sourceId, edge.targetId].sort().join('|');
    if (!pairSeen.has(key)) {
      pairSeen.add(key);
      uniqueEdges.push(edge);
    }
  }

  const edges = uniqueEdges.map(edge => ({
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    label: capitalizeFirst(edge.relationshipType.toLowerCase()),
    data: { status: edge.status, relationshipType: edge.relationshipType },
    type: 'smoothstep',
    animated: edge.status === 'DISPUTED',
  }));

  return { nodes, edges };
}

// ─────────────────────────────────────────────
// Convert graph to hierarchical tree format
// ─────────────────────────────────────────────

export function graphToTreeData(graph: FamilyGraph, rootUserId: string) {
  function buildTree(
    nodeId: string,
    visited: Set<string>,
  ): any {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const node = graph.nodes.get(nodeId);
    if (!node) return null;

    const children = (graph.adjacency.get(nodeId) || [])
      .map(({ targetId, edge }) => {
        const child = buildTree(targetId, visited);
        if (!child) return null;
        return { ...child, relationshipType: edge.relationshipType, edgeStatus: edge.status };
      })
      .filter(Boolean);

    return {
      id: node.id,
      name: node.name,
      surname: node.familySurname,
      accountType: node.accountType,
      isRoot: node.isRoot,
      children,
    };
  }

  return buildTree(rootUserId, new Set());
}
