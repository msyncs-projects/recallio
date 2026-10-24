'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Search, 
  Tag, 
  ArrowLeft, 
  BookOpen, 
  Layers,
  Folder
} from 'lucide-react';
import { useRem } from '@/context/RemContext';
import { GraphNode, GraphLink } from '@/types';
import { extractReferences } from '@/lib/cardParser';

export const KnowledgeGraph: React.FC = () => {
  const { rems, cards, activeRemId, zoomIntoRem, setActiveView, theme } = useRem();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Persistent node positions & velocities across renders (prevents resetting and flickering)
  const nodePhysicsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(
    new Map()
  );
  const hoveredNodeIdRef = useRef<string | null>(null);
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });

  // Transform Rems into Graph Nodes and Links
  const { nodes, links, allTags } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const linkList: GraphLink[] = [];
    const tagsSet = new Set<string>();

    rems.forEach((r, idx) => {
      const isDocument = r.parentId === null;
      const isFolder = r.type === 'folder';
      const cardCount = cards.filter((c) => c.remId === r.id).length;
      r.tags?.forEach((t) => tagsSet.add(t));

      // Clean display label
      let label = r.text.split('::')[0].trim();
      if (!label) label = isFolder ? 'Untitled Folder' : 'Untitled Note';
      if (label.length > 28) label = label.slice(0, 26) + '...';

      // Check if node already has a stable position in physics ref
      let physics = nodePhysicsRef.current.get(r.id);
      if (!physics) {
        // Deterministic initial placement spread out in a circle
        const angle = (idx / Math.max(1, rems.length)) * Math.PI * 2;
        const dist = 70 + (idx % 4) * 55;
        physics = {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
        };
        nodePhysicsRef.current.set(r.id, physics);
      }

      nodeMap.set(r.id, {
        id: r.id,
        text: label,
        type: r.type,
        cardCount,
        isCurrent: r.id === activeRemId,
        x: physics.x,
        y: physics.y,
        vx: physics.vx,
        vy: physics.vy,
        radius: isFolder ? 18 : isDocument ? 15 : cardCount > 0 ? 10 : 7,
      });
    });

    // Create hierarchy and reference links
    rems.forEach((r) => {
      // Hierarchy links
      if (r.parentId && nodeMap.has(r.parentId) && nodeMap.has(r.id)) {
        linkList.push({
          source: r.parentId,
          target: r.id,
          type: 'hierarchy',
        });
      }

      // Explicit references [[Title]]
      const refs = extractReferences(r.text);
      refs.forEach((ref) => {
        const target = rems.find(
          (other) => other.text.toLowerCase().includes(ref.toLowerCase()) && other.id !== r.id
        );
        if (target && nodeMap.has(target.id) && nodeMap.has(r.id)) {
          linkList.push({
            source: r.id,
            target: target.id,
            type: 'reference',
          });
        }
      });
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links: linkList,
      allTags: Array.from(tagsSet),
    };
  }, [rems, cards, activeRemId]);

  // Simulation and Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let cameraX = cameraRef.current.x;
    let cameraY = cameraRef.current.y;
    let zoom = cameraRef.current.zoom;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let draggedNode: GraphNode | null = null;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Filter nodes if tag or search applied
    const filteredNodeIds = new Set(
      nodes
        .filter((n) => {
          const rem = rems.find((r) => r.id === n.id);
          const matchesQuery =
            !searchQuery ||
            n.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rem?.text.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesTag = !selectedTag || rem?.tags?.includes(selectedTag);
          return matchesQuery && matchesTag;
        })
        .map((n) => n.id)
    );

    // Stable, smooth force simulation with alpha cooling to prevent vibration & infinite loop
    let alpha = 1.0;

    const simulate = () => {
      // 1. Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = (b.x || 0) - (a.x || 0);
          const dy = (b.y || 0) - (a.y || 0);
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 260) {
            const force = Math.min(2.0, 750 / (distSq + 350)) * alpha;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx = (a.vx || 0) - fx;
            a.vy = (a.vy || 0) - fy;
            b.vx = (b.vx || 0) + fx;
            b.vy = (b.vy || 0) + fy;
          }
        }
      }

      // 2. Link attraction springs
      links.forEach((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (sourceNode && targetNode) {
          const dx = (targetNode.x || 0) - (sourceNode.x || 0);
          const dy = (targetNode.y || 0) - (sourceNode.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = link.type === 'reference' ? 100 : 60;
          const spring = Math.max(-1.5, Math.min(1.5, (dist - targetDist) * 0.012)) * alpha;
          const fx = (dx / dist) * spring;
          const fy = (dy / dist) * spring;

          sourceNode.vx = (sourceNode.vx || 0) + fx;
          sourceNode.vy = (sourceNode.vy || 0) + fy;
          targetNode.vx = (targetNode.vx || 0) - fx;
          targetNode.vy = (targetNode.vy || 0) - fy;
        }
      });

      // 3. Central gravity, velocity clamping & high damping (equilibrium halt)
      let totalMovement = 0;
      nodes.forEach((n) => {
        if (n !== draggedNode) {
          // Damping & central attraction
          n.vx = ((n.vx || 0) * 0.74) - (n.x || 0) * 0.002;
          n.vy = ((n.vy || 0) * 0.74) - (n.y || 0) * 0.002;

          // Deadzone threshold halts jitter
          if (Math.abs(n.vx) < 0.04) n.vx = 0;
          if (Math.abs(n.vy) < 0.04) n.vy = 0;

          totalMovement += Math.abs(n.vx) + Math.abs(n.vy);

          const speed = Math.hypot(n.vx, n.vy);
          if (speed > 4) {
            n.vx = (n.vx / speed) * 4;
            n.vy = (n.vy / speed) * 4;
          }

          n.x = (n.x || 0) + n.vx;
          n.y = (n.y || 0) + n.vy;

          const saved = nodePhysicsRef.current.get(n.id);
          if (saved) {
            saved.x = n.x;
            saved.y = n.y;
            saved.vx = n.vx;
            saved.vy = n.vy;
          }
        }
      });

      if (totalMovement < 0.05 && !draggedNode) {
        alpha = 0; // Reached equilibrium: complete stop
      }
    };

    // Render loop
    const render = () => {
      if (alpha > 0.001 || draggedNode || isDragging) {
        simulate();
        alpha *= 0.985;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Pan & Zoom transform
      ctx.translate(width / 2 + cameraX, height / 2 + cameraY);
      ctx.scale(zoom, zoom);

      const isDark = theme === 'dark';

      // 1. Draw Links
      links.forEach((link) => {
        const source = nodes.find((n) => n.id === link.source);
        const target = nodes.find((n) => n.id === link.target);
        if (source && target) {
          const isHighlighted =
            filteredNodeIds.has(source.id) && filteredNodeIds.has(target.id);

          ctx.beginPath();
          ctx.moveTo(source.x || 0, source.y || 0);
          ctx.lineTo(target.x || 0, target.y || 0);

          if (link.type === 'reference') {
            ctx.strokeStyle = isHighlighted
              ? isDark ? '#38bdf8' : '#0284c7'
              : isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
          } else {
            ctx.strokeStyle = isHighlighted
              ? isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.14)'
              : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // 2. Draw Nodes
      nodes.forEach((node) => {
        const isMatch = filteredNodeIds.has(node.id);
        const radius = node.radius || 8;
        const x = node.x || 0;
        const y = node.y || 0;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (node.isCurrent) {
          // Current active document
          ctx.fillStyle = '#3b82f6';
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur = 10;
        } else if (node.type === 'folder') {
          ctx.fillStyle = isDark ? '#f59e0b' : '#d97706';
          ctx.shadowBlur = 0;
        } else if (node.type === 'document') {
          ctx.fillStyle = isDark ? '#a855f7' : '#9333ea';
          ctx.shadowBlur = 0;
        } else if (node.cardCount > 0) {
          ctx.fillStyle = isDark ? '#10b981' : '#059669';
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = isDark ? (isMatch ? '#71717a' : '#27272a') : (isMatch ? '#a1a1aa' : '#e4e4e7');
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0;

        // Label for folders, documents or highlighted matches
        const isHovered = hoveredNodeIdRef.current === node.id;
        if (node.type === 'document' || node.type === 'folder' || isMatch || isHovered) {
          ctx.font = `${node.type === 'document' || node.type === 'folder' ? 'bold 12px' : '10px'} system-ui, -apple-system, sans-serif`;
          ctx.fillStyle = isDark
            ? isMatch ? '#f4f4f5' : '#71717a'
            : isMatch ? '#18181b' : '#71717a';
          ctx.textAlign = 'center';
          ctx.fillText(node.text, x, y + radius + 13);
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse Interactions (Pan, Zoom, Drag node, Hover)
    const getCanvasCoords = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const worldX = (clientX - rect.width / 2 - cameraX) / zoom;
      const worldY = (clientY - rect.height / 2 - cameraY) / zoom;
      return { clientX, clientY, worldX, worldY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      const { worldX, worldY, clientX, clientY } = getCanvasCoords(e);
      // Check if clicked a node
      const clicked = nodes.find((n) => {
        const dx = (n.x || 0) - worldX;
        const dy = (n.y || 0) - worldY;
        return Math.sqrt(dx * dx + dy * dy) <= (n.radius || 10) + 4;
      });

      if (clicked) {
        draggedNode = clicked;
        alpha = 0.8;
      } else {
        isDragging = true;
        alpha = 0.6;
        dragStartX = clientX - cameraX;
        dragStartY = clientY - cameraY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { worldX, worldY, clientX, clientY } = getCanvasCoords(e);

      if (draggedNode) {
        draggedNode.x = worldX;
        draggedNode.y = worldY;
        draggedNode.vx = 0;
        draggedNode.vy = 0;
        const saved = nodePhysicsRef.current.get(draggedNode.id);
        if (saved) {
          saved.x = worldX;
          saved.y = worldY;
          saved.vx = 0;
          saved.vy = 0;
        }
        return;
      }

      if (isDragging) {
        cameraX = clientX - dragStartX;
        cameraY = clientY - dragStartY;
        cameraRef.current.x = cameraX;
        cameraRef.current.y = cameraY;
        return;
      }

      // Check hover (only trigger React state change when hovered ID actually changes)
      const hovered = nodes.find((n) => {
        const dx = (n.x || 0) - worldX;
        const dy = (n.y || 0) - worldY;
        return Math.sqrt(dx * dx + dy * dy) <= (n.radius || 10) + 4;
      });

      const nextHoveredId = hovered?.id || null;
      if (nextHoveredId !== hoveredNodeIdRef.current) {
        hoveredNodeIdRef.current = nextHoveredId;
        setHoveredNode(hovered || null);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const { worldX, worldY } = getCanvasCoords(e);
      if (draggedNode) {
        const dx = (draggedNode.x || 0) - worldX;
        const dy = (draggedNode.y || 0) - worldY;
        if (Math.hypot(dx, dy) < 4) {
          zoomIntoRem(draggedNode.id);
        }
        draggedNode = null;
      }
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      zoom = Math.max(0.2, Math.min(3, zoom * zoomFactor));
      cameraRef.current.zoom = zoom;
      alpha = 0.5;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [nodes, links, searchQuery, selectedTag, theme, rems, zoomIntoRem]);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setActiveView('editor')}
            className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-blue-500 shadow-sm transition-colors cursor-pointer"
            title="Return to Editor"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Search within Graph */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts or notes..."
              className="pl-8 pr-3 py-1.5 w-48 sm:w-64 text-xs rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Tags filter & legend */}
        <div className="flex items-center gap-1.5 flex-wrap pointer-events-auto">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shadow-sm cursor-pointer ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas */}
      <canvas ref={canvasRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing block" />

      {/* Floating Hover Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-6 left-6 z-10 p-3 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-xs space-y-1 animate-in fade-in">
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate flex items-center gap-1.5">
            {hoveredNode.type === 'folder' ? (
              <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : (
              <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            )}
            <span className="truncate">{hoveredNode.text}</span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <span className="capitalize">{hoveredNode.type}</span>
            <span>•</span>
            <span>{hoveredNode.cardCount} cards</span>
          </div>
          <div className="text-[10px] text-blue-500 font-semibold pt-0.5">
            Click to open note ↗
          </div>
        </div>
      )}

      {/* Graph Legend */}
      <div className="absolute bottom-6 right-6 z-10 px-3 py-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-md text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Folder
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Document
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Has Flashcards
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Current
        </span>
      </div>
    </div>
  );
};
