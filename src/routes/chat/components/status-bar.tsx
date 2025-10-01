import { useState, useMemo } from 'react';
import { Activity, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProjectStage } from '../utils/project-stage-helpers';

export interface StatusActivity {
	id: string;
	timestamp: number;
	type: string;
	message: string;
	status: 'active' | 'completed' | 'error' | 'info';
}

interface StatusBarProps {
	// Current operation state
	isGenerating: boolean;
	isDeploying: boolean;
	isPreviewDeploying: boolean;
	isThinking: boolean;
	isGeneratingBlueprint: boolean;

	// Progress tracking
	progress: number;
	total: number;
	projectStages: ProjectStage[];

	// WebSocket health
	websocketConnected: boolean;
	lastMessageTimestamp: number;

	// Activity log
	recentActivities: StatusActivity[];
}

export function StatusBar({
	isGenerating,
	isDeploying,
	isPreviewDeploying,
	isThinking,
	isGeneratingBlueprint,
	progress,
	total,
	projectStages,
	websocketConnected,
	lastMessageTimestamp,
	recentActivities,
}: StatusBarProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	// Determine current operation
	const currentOperation = useMemo(() => {
		if (isDeploying) return { text: 'Deploying to Cloudflare', icon: 'deploy', status: 'active' };
		if (isPreviewDeploying) return { text: 'Deploying Preview', icon: 'deploy', status: 'active' };
		if (isGeneratingBlueprint) return { text: 'Creating Blueprint', icon: 'blueprint', status: 'active' };
		if (isThinking) return { text: 'Planning Next Phase', icon: 'thinking', status: 'active' };
		if (isGenerating) return { text: 'Generating Code', icon: 'generating', status: 'active' };

		// Check project stages for active operations
		const activeStage = projectStages.find(s => s.status === 'active');
		if (activeStage) {
			return { text: activeStage.title, icon: 'stage', status: 'active' };
		}

		return { text: 'Ready', icon: 'idle', status: 'idle' };
	}, [isGenerating, isDeploying, isPreviewDeploying, isThinking, isGeneratingBlueprint, projectStages]);

	// WebSocket health status
	const wsHealth = useMemo(() => {
		if (!websocketConnected) return { status: 'disconnected', color: 'text-red-500' };

		const timeSinceLastMessage = Date.now() - lastMessageTimestamp;
		const isActive = isGenerating || isDeploying || isPreviewDeploying || isThinking || isGeneratingBlueprint;

		// If active but no message for >30s, might be frozen
		if (isActive && timeSinceLastMessage > 30000) {
			return { status: 'stalled', color: 'text-orange-500' };
		}

		return { status: 'connected', color: 'text-green-500' };
	}, [websocketConnected, lastMessageTimestamp, isGenerating, isDeploying, isPreviewDeploying, isThinking, isGeneratingBlueprint]);

	// Format last activity time
	const timeSinceLastActivity = useMemo(() => {
		if (!lastMessageTimestamp) return 'N/A';
		const seconds = Math.floor((Date.now() - lastMessageTimestamp) / 1000);
		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ago`;
	}, [lastMessageTimestamp]);

	const getOperationIcon = () => {
		if (currentOperation.status === 'idle') return <CheckCircle2 className="size-4 text-green-500" />;
		return <Loader2 className="size-4 animate-spin text-blue-500" />;
	};

	return (
		<div className="border-b border-border-primary bg-bg-2">
			{/* Compact Status Bar */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full px-4 py-2 flex items-center justify-between hover:bg-bg-3 transition-colors"
			>
				<div className="flex items-center gap-3">
					{getOperationIcon()}
					<span className="text-sm font-medium text-text-primary">
						{currentOperation.text}
					</span>
					{currentOperation.status === 'active' && (
						<span className="text-xs text-text-tertiary">
							{progress}/{total} phases
						</span>
					)}
				</div>

				<div className="flex items-center gap-3">
					{/* WebSocket Health Indicator */}
					<div className="flex items-center gap-1.5" title={`WebSocket: ${wsHealth.status}`}>
						<Circle className={`size-2 ${wsHealth.color} fill-current`} />
						<span className="text-xs text-text-tertiary hidden sm:inline">
							{timeSinceLastActivity}
						</span>
					</div>

					{/* Expand/Collapse */}
					{isExpanded ? (
						<ChevronUp className="size-4 text-text-tertiary" />
					) : (
						<ChevronDown className="size-4 text-text-tertiary" />
					)}
				</div>
			</button>

			{/* Expanded Status Panel */}
			<AnimatePresence>
				{isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden border-t border-border-primary"
					>
						<div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
							{/* Connection Status */}
							<div className="space-y-2">
								<h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
									Connection Status
								</h4>
								<div className="flex items-center gap-2 text-sm">
									{websocketConnected ? (
										<>
											<CheckCircle2 className="size-4 text-green-500" />
											<span className="text-text-primary">Connected</span>
										</>
									) : (
										<>
											<AlertCircle className="size-4 text-red-500" />
											<span className="text-text-primary">Disconnected</span>
										</>
									)}
								</div>
								{wsHealth.status === 'stalled' && (
									<div className="text-xs text-orange-500 flex items-center gap-1">
										<AlertCircle className="size-3" />
										No activity for {timeSinceLastActivity} - system may be stalled
									</div>
								)}
							</div>

							{/* Progress Details */}
							<div className="space-y-2">
								<h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
									Progress
								</h4>
								<div className="space-y-1">
									<div className="flex justify-between text-sm">
										<span className="text-text-tertiary">Phases Completed</span>
										<span className="text-text-primary font-medium">{progress}/{total}</span>
									</div>
									<div className="w-full bg-bg-3 rounded-full h-2">
										<div
											className="bg-blue-500 h-2 rounded-full transition-all duration-300"
											style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
										/>
									</div>
								</div>
							</div>

							{/* Project Stages */}
							<div className="space-y-2">
								<h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
									Project Stages
								</h4>
								<div className="space-y-1">
									{projectStages.map((stage) => (
										<div key={stage.id} className="flex items-center gap-2 text-sm">
											{stage.status === 'completed' && (
												<CheckCircle2 className="size-3 text-green-500" />
											)}
											{stage.status === 'active' && (
												<Loader2 className="size-3 animate-spin text-blue-500" />
											)}
											{stage.status === 'pending' && (
												<Circle className="size-3 text-text-tertiary" />
											)}
											<span className={`text-xs ${
												stage.status === 'completed' ? 'text-text-tertiary line-through' :
												stage.status === 'active' ? 'text-text-primary font-medium' :
												'text-text-tertiary'
											}`}>
												{stage.title}
											</span>
											{stage.metadata && (
												<span className="text-xs text-text-tertiary ml-auto">
													{stage.metadata}
												</span>
											)}
										</div>
									))}
								</div>
							</div>

							{/* Recent Activity Log */}
							<div className="space-y-2">
								<h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
									Recent Activity
								</h4>
								<div className="space-y-1 max-h-[200px] overflow-y-auto">
									{recentActivities.length === 0 ? (
										<div className="text-xs text-text-tertiary italic">No recent activity</div>
									) : (
										recentActivities.slice(-10).reverse().map((activity) => (
											<div key={activity.id} className="flex items-start gap-2 text-xs py-1">
												{activity.status === 'active' && <Loader2 className="size-3 animate-spin text-blue-500 mt-0.5" />}
												{activity.status === 'completed' && <CheckCircle2 className="size-3 text-green-500 mt-0.5" />}
												{activity.status === 'error' && <AlertCircle className="size-3 text-red-500 mt-0.5" />}
												{activity.status === 'info' && <Activity className="size-3 text-text-tertiary mt-0.5" />}
												<div className="flex-1 min-w-0">
													<div className="text-text-primary truncate">{activity.message}</div>
													<div className="text-text-tertiary text-[10px]">
														{new Date(activity.timestamp).toLocaleTimeString()}
													</div>
												</div>
											</div>
										))
									)}
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
