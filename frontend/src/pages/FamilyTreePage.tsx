import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import type { Node, Edge, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../lib/api';
import { TreePine, RefreshCw } from 'lucide-react';

// ── Custom Family Node ────────────────────────
function FamilyNode({ data }: NodeProps) {
  const navigate = useNavigate();

  const bgColor = data.isRoot
    ? 'linear-gradient(135deg, #2d6a3f, #52a66e)'
    : data.accountType === 'DUMMY'
    ? 'var(--color-surface-700)'
    : 'linear-gradient(135deg, #1e2e22, #263a2b)';

  const borderColor = data.highlighted
    ? '#c9a227'
    : data.isRoot
    ? '#52a66e'
    : data.accountType === 'DUMMY'
    ? 'rgba(168,196,175,0.2)'
    : 'rgba(58,133,81,0.3)';

  return (
    <div
      onClick={() => navigate(`/users/${data.id}`)}
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        minWidth: '140px',
        cursor: 'pointer',
        boxShadow: data.highlighted
          ? '0 0 16px rgba(201,162,39,0.5)'
          : data.isRoot
          ? '0 0 12px rgba(82,166,110,0.4)'
          : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'all 0.2s',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: borderColor, border: 'none' }} />

      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '2rem', height: '2rem', borderRadius: '50%',
          background: data.isRoot ? 'rgba(255,255,255,0.2)' : 'rgba(58,133,81,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 0.4rem',
          fontSize: '0.85rem', fontWeight: 700, color: 'white',
        }}>
          {(data.label as string)?.[0]?.toUpperCase()}
        </div>

        <div style={{
          fontWeight: 600, color: 'white', fontSize: '0.8rem',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: '120px',
        }}>
          {data.label as string}
        </div>

        {Boolean(data.surname) && (
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.1rem' }}>
            {data.surname as string}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', marginTop: '0.35rem' }}>
          {Boolean(data.isRoot) && (
            <span style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', padding: '1px 5px', color: 'white' }}>
              You
            </span>
          )}
          {data.accountType === 'DUMMY' && (
            <span style={{ fontSize: '0.6rem', background: 'rgba(168,196,175,0.15)', borderRadius: '4px', padding: '1px 5px', color: 'rgba(168,196,175,0.8)' }}>
              Dummy
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: borderColor, border: 'none' }} />
    </div>
  );
}

const nodeTypes = { familyNode: FamilyNode };

// ── Layout helper: hierarchical positioning (generational BFS) ───
function layoutNodes(rawNodes: any[], rawEdges: any[], rootId: string) {
  const levelMap = new Map<string, number>();
  levelMap.set(rootId, 0);

  const getOffset = (relType: string): number => {
    switch (relType) {
      case 'FATHER': case 'MOTHER': case 'PARENT': case 'UNCLE': case 'AUNT': return -1;
      case 'GRANDFATHER': case 'GRANDMOTHER': return -2;
      case 'SON': case 'DAUGHTER': return 1;
      default: return 0; // Siblings, spouses
    }
  };

  // Build adjacency list with generational offsets
  const adj = new Map<string, { target: string, offset: number }[]>();
  for (const edge of rawEdges) {
    const s = edge.source;
    const t = edge.target;
    const type = edge.data?.relationshipType || '';
    const offset = getOffset(type);

    if (!adj.has(s)) adj.set(s, []);
    adj.get(s)!.push({ target: t, offset: offset });

    if (!adj.has(t)) adj.set(t, []);
    adj.get(t)!.push({ target: s, offset: -offset }); // inverse direction negates offset
  }

  // BFS to assign levels
  const queue = [rootId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const currentLevel = levelMap.get(id) || 0;
    const neighbors = adj.get(id) || [];

    for (const n of neighbors) {
      if (!levelMap.has(n.target)) {
        levelMap.set(n.target, currentLevel + n.offset);
        queue.push(n.target);
      }
    }
  }

  // Any nodes not reachable get placed at level 0
  for (const node of rawNodes) {
    if (!levelMap.has(node.id)) levelMap.set(node.id, 0);
  }

  // Group by level
  const byLevel = new Map<number, string[]>();
  for (const [id, level] of levelMap.entries()) {
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level)!.push(id);
  }

  const positioned = rawNodes.map(node => {
    const level = levelMap.get(node.id) ?? 0;
    const siblings = byLevel.get(level) || [node.id];
    const idx = siblings.indexOf(node.id);
    const totalWidth = siblings.length * 220;
    const x = idx * 220 - totalWidth / 2 + 110;
    const y = level * 180;

    return { ...node, position: { x, y } };
  });

  return positioned;
}

export function FamilyTreePage() {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [highlightedPath] = useState<string[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['family', 'graph'],
    queryFn: () => api.get('/family/graph').then(r => r.data.data),
    staleTime: 0,           // always consider data stale → refetch on every mount
    refetchOnMount: true,   // refetch when navigating to this page
    refetchOnWindowFocus: true, // refetch when user switches back to this tab
    refetchInterval: 15_000,    // poll every 15 s so all family members stay in sync
  });

  const refreshTree = () => queryClient.invalidateQueries({ queryKey: ['family', 'graph'] });

  useEffect(() => {
    if (!data) return;

    const rawNodes: Node[] = data.nodes.map((n: any) => ({
      id: n.id,
      type: 'familyNode',
      position: { x: 0, y: 0 },
      data: {
        id: n.id,
        label: n.data.label,
        surname: n.data.surname,
        accountType: n.data.accountType,
        isRoot: n.data.isRoot,
        highlighted: highlightedPath.includes(n.id),
      },
    }));

    const rawEdges: Edge[] = data.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: 'smoothstep',
      animated: e.animated,
      data: e.data,
      style: {
        stroke: highlightedPath.includes(e.source) && highlightedPath.includes(e.target)
          ? '#c9a227'
          : 'var(--color-brand-600)',
        strokeWidth: highlightedPath.includes(e.source) && highlightedPath.includes(e.target) ? 3 : 2,
      },
      labelStyle: { fill: 'var(--color-text-secondary)', fontSize: 11 },
      labelBgStyle: { fill: 'var(--color-surface-800)', fillOpacity: 0.9 },
    }));

    const rootId = data.rootUserId;
    const positioned = layoutNodes(rawNodes, rawEdges, rootId);

    setNodes(positioned);
    setEdges(rawEdges);
  }, [data, highlightedPath]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid rgba(58,133,81,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.1rem' }}>Family Tree</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
            {data?.nodes?.length || 0} people · {data?.edges?.length || 0} connections
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Click a person to open their profile</span>
          <button
            onClick={refreshTree}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Refresh tree"
          >
            <RefreshCw size={14} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tree Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
            <div className="spinner" />
            <span style={{ color: 'var(--color-text-muted)' }}>Building your family tree...</span>
          </div>
        ) : (data?.nodes?.length || 0) === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
            <TreePine size={48} color="var(--color-brand-700)" />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem' }}>Your tree is empty</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>Add relatives to start building your family tree</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ background: 'var(--color-surface-950)' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(58,133,81,0.1)" gap={24} size={1} />
            <Controls
              style={{
                background: 'var(--color-surface-800)',
                border: '1px solid rgba(58,133,81,0.2)',
                borderRadius: '8px',
              }}
            />
            <MiniMap
              nodeColor={(node) => {
                if (node.data?.isRoot) return '#52a66e';
                if (node.data?.accountType === 'DUMMY') return '#3a4a3d';
                return '#2d6a3f';
              }}
              style={{
                background: 'var(--color-surface-900)',
                border: '1px solid rgba(58,133,81,0.2)',
              }}
            />
          </ReactFlow>
        )}
      </div>

      {/* Legend */}
      <div style={{
        padding: '0.75rem 2rem',
        borderTop: '1px solid rgba(58,133,81,0.15)',
        display: 'flex', gap: '1.5rem', flexShrink: 0,
        fontSize: '0.78rem', color: 'var(--color-text-muted)',
      }}>
        <LegendItem color="linear-gradient(135deg, #2d6a3f, #52a66e)" label="You" />
        <LegendItem color="linear-gradient(135deg, #1e2e22, #263a2b)" label="Family member" />
        <LegendItem color="var(--color-surface-700)" label="Dummy profile" />
        <LegendItem color="#c9a227" label="Highlighted path" border />
      </div>
    </div>
  );
}

function LegendItem({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{
        width: '14px', height: '14px', borderRadius: '4px',
        background: color,
        border: border ? '2px solid #c9a227' : 'none',
        flexShrink: 0,
      }} />
      {label}
    </div>
  );
}
