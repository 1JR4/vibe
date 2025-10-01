import { useState, useCallback } from 'react';
import type { StatusActivity } from '../components/status-bar';
import type { WebSocketMessage } from '@/api-types';

const MAX_ACTIVITIES = 50; // Keep last 50 activities

export function useStatusTracker() {
	const [activities, setActivities] = useState<StatusActivity[]>([]);
	const [lastMessageTimestamp, setLastMessageTimestamp] = useState(Date.now());
	const [websocketConnected, setWebsocketConnected] = useState(false);

	// Track WebSocket connection
	const updateWebSocketStatus = useCallback((connected: boolean) => {
		setWebsocketConnected(connected);
	}, []);

	// Add a new activity to the log
	const addActivity = useCallback((
		type: string,
		message: string,
		status: StatusActivity['status'] = 'info'
	) => {
		const activity: StatusActivity = {
			id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
			timestamp: Date.now(),
			type,
			message,
			status,
		};

		setActivities(prev => {
			const updated = [...prev, activity];
			// Keep only last MAX_ACTIVITIES
			if (updated.length > MAX_ACTIVITIES) {
				return updated.slice(-MAX_ACTIVITIES);
			}
			return updated;
		});

		setLastMessageTimestamp(Date.now());
	}, []);

	// Track WebSocket messages and convert them to activities
	const trackWebSocketMessage = useCallback((message: WebSocketMessage) => {
		setLastMessageTimestamp(Date.now());

		// Map WebSocket messages to user-friendly activity descriptions
		switch (message.type) {
			case 'generation_started':
				addActivity('generation_started', `Starting code generation (${message.totalFiles} files)`, 'active');
				break;

			case 'phase_generating':
				addActivity('phase_generating', message.message, 'active');
				break;

			case 'phase_generated':
				addActivity('phase_generated', message.message, 'completed');
				break;

			case 'phase_implementing':
				addActivity('phase_implementing', message.message, 'active');
				break;

			case 'phase_implemented':
				addActivity('phase_implemented', message.message, 'completed');
				break;

			case 'phase_validating':
				addActivity('phase_validating', message.message, 'active');
				break;

			case 'phase_validated':
				addActivity('phase_validated', message.message, 'completed');
				break;

			case 'file_generating':
				addActivity('file_generating', `Generating: ${message.filePath}`, 'active');
				break;

			case 'file_generated':
				addActivity('file_generated', `Completed: ${message.file.filePath}`, 'completed');
				break;

			case 'file_regenerating':
				addActivity('file_regenerating', `Regenerating: ${message.filePath}`, 'active');
				break;

			case 'file_regenerated':
				addActivity('file_regenerated', `Regenerated: ${message.file.filePath}`, 'completed');
				break;

			case 'deployment_started':
				addActivity('deployment_started', 'Deploying to preview sandbox', 'active');
				break;

			case 'deployment_completed':
				addActivity('deployment_completed', 'Preview deployment completed', 'completed');
				break;

			case 'deployment_failed':
				addActivity('deployment_failed', `Deployment failed: ${message.message}`, 'error');
				break;

			case 'code_reviewing':
				addActivity('code_reviewing', 'Reviewing generated code', 'active');
				break;

			case 'code_reviewed':
				addActivity('code_reviewed', 'Code review completed', 'completed');
				break;

			case 'generation_complete':
				addActivity('generation_complete', 'Code generation completed', 'completed');
				break;

			case 'generation_stopped':
				addActivity('generation_stopped', 'Code generation stopped', 'info');
				break;

			case 'generation_resumed':
				addActivity('generation_resumed', 'Code generation resumed', 'active');
				break;

			case 'cloudflare_deployment_started':
				addActivity('cloudflare_deployment_started', 'Deploying to Cloudflare Workers', 'active');
				break;

			case 'cloudflare_deployment_completed':
				addActivity('cloudflare_deployment_completed', 'Cloudflare deployment completed', 'completed');
				break;

			case 'cloudflare_deployment_error':
				addActivity('cloudflare_deployment_error', `Deployment error: ${message.error}`, 'error');
				break;

			case 'runtime_error_found':
				addActivity('runtime_error_found', `Runtime errors detected (${message.count})`, 'error');
				break;

			case 'deterministic_code_fix_started':
				addActivity('deterministic_code_fix_started', 'Fixing code issues', 'active');
				break;

			case 'deterministic_code_fix_completed':
				addActivity('deterministic_code_fix_completed', 'Code fixes applied', 'completed');
				break;

			case 'conversation_response':
				if (message.tool) {
					const toolName = message.tool.name;
					const toolStatus = message.tool.status;
					if (toolStatus === 'start') {
						addActivity('tool_start', `Running tool: ${toolName}`, 'active');
					} else if (toolStatus === 'success') {
						addActivity('tool_success', `Tool completed: ${toolName}`, 'completed');
					} else if (toolStatus === 'error') {
						addActivity('tool_error', `Tool failed: ${toolName}`, 'error');
					}
				}
				break;

			case 'error':
				addActivity('error', message.error, 'error');
				break;

			case 'rate_limit_error':
				addActivity('rate_limit_error', `Rate limit exceeded`, 'error');
				break;

			// Don't log these frequent/non-important messages
			case 'cf_agent_state':
			case 'file_chunk_generated':
				break;

			default:
				// Log unknown message types for debugging
				if (message.type.length <= 50) {
					addActivity(message.type, `Event: ${message.type}`, 'info');
				}
		}
	}, [addActivity]);

	return {
		activities,
		lastMessageTimestamp,
		websocketConnected,
		addActivity,
		trackWebSocketMessage,
		updateWebSocketStatus,
	};
}
