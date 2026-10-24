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
  Layers 
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

  // Transform Rems into Graph Nodes and Links
  const { nodes, links, allTags } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const linkList: GraphLink[] = [];
    const tagsSet = new Set<string>();

    rems.forEach((r) => {
      const isDocument = r.parentId === null;
      const cardCount = cards.filter((c) => c.remId === r.id).length;
      r.tags?.forEach((t) => tagsSet.add(t));

      // Clean display label
      let label = r.text.split('::')[0].trim();
      if (!label) label = 'Untitled';
      if (label.length > 32) label = label.slice(0, 30) + '...';

      // Deterministic initial placement using hash of r.id (prerender-safe)
      const hash = r.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const angle = (hash % 360) * (Math.PI / 180);
      const dist = 40 + (hash % 220);
      const initX = Math.cos(angle) * dist;
      const initY = Math.sin(angle) * dist;

      nodeMap.set(r.id, {
        id: r.id,
        text: label,
        type: r.type,
        cardCount,
        isCurrent: r.id === activeRemId,
        x: initX,
        y: initY,
        vx: 0,
        vy: 0,
        radius: isDocument ? 16 : cardCount > 0 ? 11 : 7,
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

  // Simulation and Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let cameraX = 0;
    let cameraY = 0;
    let zoom = 1;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let draggedNode: GraphNode | null = null;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
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

    // Simple Force-Directed Graph Simulation loop
    const simulate = () => {
      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = (b.x || 0) - (a.x || 0);
          const dy = (b.y || 0) - (a.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < 250) {
            const force = (250 - dist) / dist * 0.05;
            a.vx = (a.vx || 0) - dx * force;
            a.vy = (a.vy || 0) - dy * force;
            b.vx = (b.vx || 0) + dx * force;
            b.vy = (b.vy || 0) + dy * force;
          }
        }
      }

      // Link attraction
      links.forEach((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (sourceNode && targetNode) {
          const dx = (targetNode.x || 0) - (sourceNode.x || 0);
          const dy = (targetNode.y || 0) - (sourceNode.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = link.type === 'reference' ? 120 : 60;
          const force = (dist - targetDist) * 0.005;

          sourceNode.vx = (sourceNode.vx || 0) + dx * force;
          sourceNode.vy = (sourceNode.vy || 0) + dy * force;
          targetNode.vx = (targetNode.vx || 0) - dx * force;
          targetNode.vy = (targetNode.vy || 0) - dy * force;
        }
      });

      // Gravity to center & damping
      nodes.forEach((n) => {
        if (n !== draggedNode) {
          n.vx = (n.vx || 0) * 0.88 - (n.x || 0) * 0.002;
          n.vy = (n.vy || 0) * 0.88 - (n.y || 0) * 0.002;
          n.x = (n.x || 0) + (n.vx || 0);
          n.y = (n.y || 0) + (n.vy || 0);
        }
      });
    };

    // Render pass
    const render = () => {
      simulate();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Pan & Zoom transform
      ctx.translate(canvas.width / 2 + cameraX, canvas.height / 2 + cameraY);
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
              : isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
          } else {
            ctx.strokeStyle = isHighlighted
              ? isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)'
              : isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
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
          ctx.shadowBlur = 12;
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

        // Label for documents or highlighted matches
        if (node.type === 'document' || isMatch || node === hoveredNode) {
          ctx.font = `${node.type === 'document' ? 'bold 12px' : '10px'} system-ui, -apple-system, sans-serif`;
          ctx.fillStyle = isDark
            ? isMatch ? '#f4f4f5' : '#71717a'
            : isMatch ? '#18181b' : '#a1a1aa';
          ctx.textAlign = 'center';
          ctx.fillText(node.text, x, y + radius + 14);
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
      const worldX = (clientX - canvas.width / 2 - cameraX) / zoom;
      const worldY = (clientY - canvas.height / 2 - cameraY) / zoom;
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
      } else {
        isDragging = true;
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
        return;
      }

      if (isDragging) {
        cameraX = clientX - dragStartX;
        cameraY = clientY - dragStartY;
        return;
      }

      // Check hover
      const hovered = nodes.find((n) => {
        const dx = (n.x || 0) - worldX;
        const dy = (n.y || 0) - worldY;
        return Math.sqrt(dx * dx + dy * dy) <= (n.radius || 10) + 4;
      });
      setHoveredNode(hovered || null);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const { worldX, worldY } = getCanvasCoords(e);
      if (draggedNode) {
        // If release was quick click without moving much, navigate to it!
        const dx = (draggedNode.x || 0) - worldX;
        const dy = (draggedNode.y || 0) - worldY;
        if (Math.sqrt(dx * dx + dy * dy) < 5) {
          zoomIntoRem(draggedNode.id);
        }
        draggedNode = null;
      }
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      zoom = Math.max(0.2, Math.min(3, zoom * zoomFactor));
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [nodes, links, searchQuery, selectedTag, theme, rems, activeRemId, zoomIntoRem]);

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
              placeholder="Search concepts or nodes..."
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
      <canvas ref={canvasRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Hover Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-6 left-6 z-10 p-3 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-xs space-y-1 animate-in fade-in">
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
            {hoveredNode.text}
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
