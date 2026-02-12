/**
 * GoalDAG Component
 *
 * 目标层级 DAG 可视�?
 * Story 11-7: Advanced Features
 *
 * 使用自定�?SVG 实现（不依赖 reactflow�?
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Target, ChevronDown, ChevronRight, Plus, MoreHorizontal, ExternalLink } from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Progress,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@dailyuse/ui-react-shadcn';

import { DAGControls, type LayoutType } from '@/renderer/shared/components/dag/DAGControls';

// Types
interface GoalNode {
  id: string;
  name: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  parentId?: string;
  children?: GoalNode[];
}

interface Position {
  x: number;
  y: number;
}

interface GoalDAGProps {
  goals: GoalNode[];
  rootGoalId?: string;
  onGoalClick?: (goal: GoalNode) => void;
  onAddChild?: (parentId: string) => void;
  className?: string;
}

// Constants
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 60;

// Status colors
const statusColors: Record<string, string> = {
  not_started: 'bg-gray-100 border-gray-300',
  in_progress: 'bg-blue-50 border-blue-300',
  completed: 'bg-green-50 border-green-300',
  paused: 'bg-orange-50 border-orange-300',
};

const statusBadgeVariants: Record<string, 'secondary' | 'default' | 'outline'> = {
  not_started: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  paused: 'secondary',
};

const statusLabels: Record<string, string> = {
  not_started: '未开�?,
  in_progress: '进行�?,
  completed: '已完�?,
  paused: '已暂�?,
};

// Build tree from flat goals
function buildTree(goals: GoalNode[], rootId?: string): GoalNode | null {
  const goalMap = new Map<string, GoalNode>();
  goals.forEach((g) => goalMap.set(g.id, { ...g, children: [] }));

  let root: GoalNode | null = null;

  goals.forEach((goal) => {
    const node = goalMap.get(goal.id)!;
    if (goal.parentId) {
      const parent = goalMap.get(goal.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else if (!rootId || goal.id === rootId) {
      root = node;
    }
  });

  if (rootId && !root) {
    root = goalMap.get(rootId) || null;
  }

  return root;
}

// Calculate node positions
function calculatePositions(
  node: GoalNode,
  depth: number = 0,
  index: number = 0,
  siblingCounts: number[] = []
): Map<string, Position> {
  const positions = new Map<string, Position>();

  const calculateSubtree = (
    n: GoalNode,
    d: number,
    startX: number
  ): { positions: Map<string, Position>; width: number } => {
    const result = new Map<string, Position>();

    if (!n.children || n.children.length === 0) {
      result.set(n.id, { x: startX, y: d * (NODE_HEIGHT + VERTICAL_GAP) });
      return { positions: result, width: NODE_WIDTH };
    }

    let currentX = startX;
    let totalWidth = 0;
    const childPositions: Map<string, Position>[] = [];

    n.children.forEach((child) => {
      const childResult = calculateSubtree(child, d + 1, currentX);
      childPositions.push(childResult.positions);
      currentX += childResult.width + HORIZONTAL_GAP;
      totalWidth += childResult.width + HORIZONTAL_GAP;
    });

    totalWidth -= HORIZONTAL_GAP; // Remove last gap

    // Center parent above children
    const firstChildX = childPositions[0]?.get(n.children[0].id)?.x || startX;
    const lastChildX =
      childPositions[childPositions.length - 1]?.get(
        n.children[n.children.length - 1].id
      )?.x || startX;
    const parentX = (firstChildX + lastChildX) / 2;

    result.set(n.id, { x: parentX, y: d * (NODE_HEIGHT + VERTICAL_GAP) });

    // Merge child positions
    childPositions.forEach((cp) => {
      cp.forEach((pos, id) => result.set(id, pos));
    });

    return { positions: result, width: Math.max(totalWidth, NODE_WIDTH) };
  };

  const { positions: calculatedPositions } = calculateSubtree(node, 0, 0);
  return calculatedPositions;
}

// GoalNodeComponent
interface GoalNodeComponentProps {
  node: GoalNode;
  position: Position;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
  onAddChild: () => void;
  transform: { scale: number; x: number; y: number };
}

function GoalNodeComponent({
  node,
  position,
  isExpanded,
  onToggle,
  onClick,
  onAddChild,
  transform,
}: GoalNodeComponentProps) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <foreignObject
      x={position.x * transform.scale + transform.x}
      y={position.y * transform.scale + transform.y}
      width={NODE_WIDTH * transform.scale}
      height={NODE_HEIGHT * transform.scale}
      style={{ overflow: 'visible' }}
    >
      <Card
        className={cn(
          'h-full cursor-pointer transition-all hover:shadow-md border-2',
          statusColors[node.status]
        )}
        style={{
          transform: `scale(${transform.scale})`,
          transformOrigin: 'top left',
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        }}
        onClick={onClick}
      >
        <div className="p-2 h-full flex flex-col">
          <div className="flex items-center gap-1.5">
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            <Target className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium truncate flex-1">
              {node.name}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onAddChild}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加子目�?
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  查看详情
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Progress value={node.progress} className="h-1 mt-1.5" />
          <div className="flex items-center justify-between mt-auto">
            <Badge variant={statusBadgeVariants[node.status]} className="text-[10px] px-1 h-4">
              {statusLabels[node.status]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{node.progress}%</span>
          </div>
        </div>
      </Card>
    </foreignObject>
  );
}

// Main Component
export function GoalDAG({
  goals,
  rootGoalId,
  onGoalClick,
  onAddChild,
  className,
}: GoalDAGProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [transform, setTransform] = useState({ scale: 1, x: 50, y: 50 });
  const [layout, setLayout] = useState<LayoutType>('tree');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Build tree and calculate positions
  const tree = useMemo(() => buildTree(goals, rootGoalId), [goals, rootGoalId]);

  const { positions, visibleNodes } = useMemo(() => {
    if (!tree) return { positions: new Map<string, Position>(), visibleNodes: [] };

    // Filter tree based on expanded state
    const filterTree = (node: GoalNode): GoalNode => {
      if (!expandedNodes.has(node.id) || !node.children) {
        return { ...node, children: [] };
      }
      return { ...node, children: node.children.map(filterTree) };
    };

    const filteredTree = filterTree(tree);
    const positions = calculatePositions(filteredTree);

    // Collect visible nodes
    const visible: GoalNode[] = [];
    const collectVisible = (n: GoalNode) => {
      visible.push(n);
      if (expandedNodes.has(n.id) && n.children) {
        n.children.forEach(collectVisible);
      }
    };
    collectVisible(tree);

    return { positions, visibleNodes: visible };
  }, [tree, expandedNodes]);

  // Toggle expand
  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Expand all initially
  useEffect(() => {
    if (tree) {
      const allIds = new Set<string>();
      const collect = (n: GoalNode) => {
        if (n.children && n.children.length > 0) {
          allIds.add(n.id);
          n.children.forEach(collect);
        }
      };
      collect(tree);
      setExpandedNodes(allIds);
    }
  }, [tree]);

  // DAG Controls handlers
  const handleZoomIn = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: Math.min(prev.scale + 0.1, 2) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.3) }));
  }, []);

  const handleFitView = useCallback(() => {
    setTransform({ scale: 1, x: 50, y: 50 });
  }, []);

  // Mouse handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setTransform((prev) => ({
          ...prev,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }));
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.3, Math.min(2, prev.scale + delta)),
    }));
  }, []);

  // Draw edges
  const edges = useMemo(() => {
    const result: { from: Position; to: Position }[] = [];

    visibleNodes.forEach((node) => {
      if (expandedNodes.has(node.id) && node.children) {
        const fromPos = positions.get(node.id);
        if (!fromPos) return;

        node.children.forEach((child) => {
          const toPos = positions.get(child.id);
          if (toPos) {
            result.push({
              from: { x: fromPos.x + NODE_WIDTH / 2, y: fromPos.y + NODE_HEIGHT },
              to: { x: toPos.x + NODE_WIDTH / 2, y: toPos.y },
            });
          }
        });
      }
    });

    return result;
  }, [visibleNodes, positions, expandedNodes]);

  if (!tree) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <div className="text-center text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>暂无目标数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Controls */}
      <DAGControls
        className="absolute top-4 left-4 z-10"
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onLayoutChange={setLayout}
        currentLayout={layout}
        zoomLevel={Math.round(transform.scale * 100)}
        showExportOptions={false}
      />

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-[600px] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const midY = (edge.from.y + edge.to.y) / 2;
          return (
            <path
              key={i}
              d={`M ${edge.from.x * transform.scale + transform.x} ${
                edge.from.y * transform.scale + transform.y
              } C ${edge.from.x * transform.scale + transform.x} ${
                midY * transform.scale + transform.y
              }, ${edge.to.x * transform.scale + transform.x} ${
                midY * transform.scale + transform.y
              }, ${edge.to.x * transform.scale + transform.x} ${
                edge.to.y * transform.scale + transform.y
              }`}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          );
        })}

        {/* Nodes */}
        {visibleNodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          return (
            <GoalNodeComponent
              key={node.id}
              node={node}
              position={pos}
              isExpanded={expandedNodes.has(node.id)}
              onToggle={() => toggleExpand(node.id)}
              onClick={() => onGoalClick?.(node)}
              onAddChild={() => onAddChild?.(node.id)}
              transform={transform}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default GoalDAG;
