import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { buildFamilyGraph, graphToTreeData, graphToNodes } from '../services/graphService';

export const familyRouter = Router();
familyRouter.use(authenticate);

// ── GET /family/graph ─────────────────────────
// Returns all nodes and edges in the user's extended family graph
familyRouter.get('/graph', async (req: AuthRequest, res) => {
  const graph = await buildFamilyGraph(req.userId!);
  const { nodes, edges } = graphToNodes(graph, req.userId!);

  res.json({
    success: true,
    data: { nodes, edges, rootUserId: req.userId! },
  });
});

// ── GET /family/tree ──────────────────────────
// Returns tree-structured data for the interactive tree view
familyRouter.get('/tree', async (req: AuthRequest, res) => {
  const graph = await buildFamilyGraph(req.userId!);
  const treeData = graphToTreeData(graph, req.userId!);

  res.json({
    success: true,
    data: { tree: treeData, rootUserId: req.userId! },
  });
});
