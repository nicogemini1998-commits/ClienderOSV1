import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

export const AGENT_IDS = [
  'LeadExtractor',
  'PainAnalyzer',
  'StrategyMapper',
  'ProposalWriter',
  'NextStepsPlanner',
];

export function useWorkflowSocket() {
  const socketRef = useRef(null);
  if (!socketRef.current) {
    socketRef.current = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
  }
  const socket = socketRef.current;

  const [connected, setConnected] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState({});
  const [workflowStatus, setWorkflowStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onAgentUpdate = ({ agentName, status, result: r }) => {
      setAgentStatuses(prev => ({ ...prev, [agentName]: { status, result: r } }));
    };

    const onSuccess = (data) => {
      setWorkflowStatus('completed');
      setResult(data);
    };

    const onError = ({ error: err }) => {
      setWorkflowStatus('error');
      setError(err);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('workflow:agent:update', onAgentUpdate);
    socket.on('workflow:success', onSuccess);
    socket.on('workflow:error', onError);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('workflow:agent:update', onAgentUpdate);
      socket.off('workflow:success', onSuccess);
      socket.off('workflow:error', onError);
    };
  }, [socket]);

  const runWorkflow = useCallback((formData) => {
    setWorkflowStatus('running');
    setAgentStatuses({});
    setResult(null);
    setError(null);
    socket.emit('workflow:request', formData);
  }, [socket]);

  const resetWorkflow = useCallback(() => {
    setWorkflowStatus('idle');
    setAgentStatuses({});
    setResult(null);
    setError(null);
  }, []);

  return { connected, agentStatuses, workflowStatus, result, error, runWorkflow, resetWorkflow };
}
