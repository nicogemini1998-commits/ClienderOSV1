import React from 'react';
import { getBezierPath, BaseEdge } from '@xyflow/react';
import { useWorkflow } from '../WorkflowContext.jsx';
import { AGENT_IDS } from '../../hooks/useWorkflowSocket.js';

export function FlowEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
}) {
  const { agentStatuses, workflowStatus } = useWorkflow();

  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  // Determine edge state from pipeline order
  const sourceAgent = data?.sourceAgent;
  const targetAgent = data?.targetAgent;

  const sourceIdx = AGENT_IDS.indexOf(sourceAgent);
  const targetIdx = AGENT_IDS.indexOf(targetAgent);

  const sourceStatus = sourceAgent ? (agentStatuses[sourceAgent]?.status || 'idle') : 'idle';
  const targetStatus = targetAgent ? (agentStatuses[targetAgent]?.status || 'idle') : 'idle';

  const isFlowing = targetStatus === 'running';
  const isComplete = sourceStatus === 'completed' && (targetStatus === 'completed' || targetStatus === 'running');
  const isDone = sourceStatus === 'completed' && targetStatus === 'completed';

  // Edge origin (from input node → first agent)
  const isInputEdge = !sourceAgent && targetStatus === 'running';
  const isInputDone = !sourceAgent && targetStatus !== 'idle';

  const stroke = isDone || isInputDone
    ? 'oklch(65% 0.18 155)'
    : isFlowing || isInputEdge
    ? 'oklch(65% 0.2 265)'
    : 'oklch(35% 0 0 / 0.5)';

  const strokeOpacity = isFlowing || isInputEdge || isDone || isInputDone ? 0.9 : 0.4;

  return (
    <>
      {/* Glow layer when active */}
      {(isFlowing || isInputEdge) && (
        <path
          d={edgePath}
          fill="none"
          stroke="oklch(65% 0.2 265)"
          strokeWidth={6}
          strokeOpacity={0.15}
          strokeLinecap="round"
        />
      )}

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
          strokeWidth: 2,
          strokeOpacity,
          transition: 'stroke 400ms cubic-bezier(0.16,1,0.3,1), stroke-opacity 400ms cubic-bezier(0.16,1,0.3,1)',
          strokeDasharray: isFlowing || isInputEdge ? '8 6' : 'none',
        }}
        className={isFlowing || isInputEdge ? 'edge-flow-active' : ''}
      />
    </>
  );
}
