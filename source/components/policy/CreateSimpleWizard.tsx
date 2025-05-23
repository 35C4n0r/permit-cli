import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text } from 'ink';
import { ResourceInput } from './ResourceInput.js';
import { ActionInput } from './ActionsInput.js';
import { RoleInput } from './RoleInput.js';
import { useResourcesApi } from '../../hooks/useResourcesApi.js';
import { useRolesApi } from '../../hooks/useRolesApi.js';
import { useParseResources } from '../../hooks/useParseResources.js';
import { useParseActions } from '../../hooks/useParseActions.js';
import { useParseRoles } from '../../hooks/useParseRoles.js';
import { components } from '../../lib/api/v1.js';

interface CreateSimpleWizardProps {
	presentResources?: string[];
	presentActions?: string[];
	presentRoles?: string[];
	onComplete?: (resource: string, action: string) => void;
	onError?: (error: string) => void;
}

export default function CreateSimpleWizard({
	presentResources,
	presentActions,
	presentRoles,
	onComplete,
	onError,
}: CreateSimpleWizardProps) {
	// Parse preset values
	const parsedResources = useParseResources(presentResources);
	const parsedActions = useParseActions(presentActions);
	const parsedRoles = useParseRoles(presentRoles);

	// Initialize step based on preset values
	const getInitialStep = () => {
		if (presentResources && presentActions && presentRoles) return 'complete';
		if (presentResources && presentActions) return 'roles';
		if (presentResources) return 'actions';
		return 'resources';
	};

	const [step, setStep] = useState<
		'resources' | 'actions' | 'roles' | 'complete'
	>(getInitialStep());
	const [resources, setResources] =
		useState<components['schemas']['ResourceCreate'][]>(parsedResources);
	const [actions, setActions] =
		useState<Record<string, components['schemas']['ActionBlockEditable']>>(
			parsedActions,
		);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<
		'idle' | 'processing' | 'error' | 'success'
	>(presentResources && presentActions && presentRoles ? 'processing' : 'idle');

	const { createBulkResources } = useResourcesApi();
	const { createBulkRoles } = useRolesApi();

	// Handle preset data processing

	// Handle completion or error states
	useEffect(() => {
		if (status === 'error') {
			if (onError) {
				onError(error || 'An unknown error occurred');
			} else {
				process.exit(1);
			}
		}

		if (status === 'success') {
			if (onComplete) {
				onComplete(resources[0]?.key || '', Object.keys(actions)[0] || '');
			} else {
				process.exit(0);
			}
		}
	}, [status, error, resources, actions, onComplete, onError]);

	const handleError = useCallback((error: string) => {
		setError(error);
		setStatus('error');
	}, []);

	const handleResourcesComplete = (
		resourceList: components['schemas']['ResourceCreate'][],
	) => {
		try {
			setResources(resourceList);
			setStep('actions');
		} catch (err) {
			handleError(`Failed to process resources: ${(err as Error).message}`);
		}
	};

	const handleActionsComplete = (
		actionDefs: Record<string, components['schemas']['ActionBlockEditable']>,
	) => {
		try {
			setActions(actionDefs);
			const updatedResources = resources.map(resource => ({
				...resource,
				actions: actionDefs,
			}));
			setResources(updatedResources);
			setStep('roles');
		} catch (err) {
			handleError(`Failed to process actions: ${(err as Error).message}`);
		}
	};

	const handleRolesComplete = useCallback(
		async (roles: components['schemas']['RoleCreate'][]) => {
			setStatus('processing');
			try {
				await createBulkResources(resources);
				await createBulkRoles(roles);
				setStatus('success');
				setResources([]);
			} catch (err) {
				handleError(`Failed to create policy: ${(err as Error).message}`);
				setResources([]);
			}
		},
		[createBulkResources, createBulkRoles, resources, handleError],
	);

	useEffect(() => {
		const processPresetData = async () => {
			if (presentResources && presentActions && presentRoles) {
				try {
					const resourcesWithActions = parsedResources.map(resource => ({
						...resource,
						actions: parsedActions,
					}));
					setResources(resourcesWithActions);
					await handleRolesComplete(parsedRoles);
				} catch (err) {
					handleError((err as Error).message);
				}
			} else if (presentResources && presentActions) {
				const resourcesWithActions = parsedResources.map(resource => ({
					...resource,
					actions: parsedActions,
				}));
				setResources(resourcesWithActions);
			}
		};

		processPresetData();
	}, [
		presentResources,
		presentActions,
		presentRoles,
		parsedResources,
		parsedActions,
		parsedRoles,
		handleRolesComplete,
		handleError,
	]);

	return (
		<Box flexDirection="column" padding={1}>
			{status === 'processing' && <Text>Processing your request...</Text>}

			{status === 'error' && !onError && (
				<Box flexDirection="column">
					<Text color="red">[Error] {error}</Text>
				</Box>
			)}

			{status === 'success' && (
				<Box flexDirection="column">
					<Text color="green">[Success] Policy table created successfully</Text>
				</Box>
			)}

			{status === 'idle' && (
				<>
					{step === 'resources' && !presentResources && (
						<ResourceInput onComplete={handleResourcesComplete} />
					)}

					{step === 'actions' && !presentActions && (
						<ActionInput
							onComplete={handleActionsComplete}
							availableResources={resources.map(r => r.key)}
						/>
					)}

					{step === 'roles' && !presentRoles && (
						<RoleInput
							availableActions={Object.keys(actions)}
							onComplete={handleRolesComplete}
							availableResources={resources.map(r => r.key)}
						/>
					)}
				</>
			)}
		</Box>
	);
}
