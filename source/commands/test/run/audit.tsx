import React from 'react';
import zod from 'zod';
import { option } from 'pastel';
import { AuthProvider } from '../../../components/AuthProvider.js';
import TestRunAuditComponent from '../../../components/test/TestRunAuditComponent.js';

export const description =
	'Test PDP against audit logs to find differences in behavior';

export const options = zod.object({
	apiKey: zod
		.string()
		.optional()
		.describe(
			option({
				description: 'Your Permit.io API key',
			}),
		),
	pdpUrl: zod
		.string()
		.default('http://localhost:7766')
		.describe(
			option({
				description:
					'URL of the (new) PDP where you want to check the decisions',
				alias: 'p',
			}),
		),
	timeFrame: zod
		.number()
		.min(6)
		.max(72)
		.default(24)
		.describe(
			option({
				description:
					'Number of hours to fetch audit logs for (6-72). Default value is 24',
				alias: 't',
			}),
		),
	sourcePdp: zod
		.string()
		.optional()
		.describe(
			option({
				description: 'ID of the PDP to filter audit logs from',
				alias: 's',
			}),
		),
	users: zod
		.array(zod.string())
		.optional()
		.describe(
			option({
				description:
					'Users to filter logs by (can be specified multiple times)',
				alias: 'u',
			}),
		),
	resources: zod
		.array(zod.string())
		.optional()
		.describe(
			option({
				description:
					'Resources to filter logs by (can be specified multiple times)',
				alias: 'r',
			}),
		),
	tenant: zod
		.string()
		.optional()
		.describe(
			option({
				description: 'Tenant to filter logs',
			}),
		),
	action: zod
		.string()
		.optional()
		.describe(
			option({
				description: 'Action to filter logs',
				alias: 'a',
			}),
		),
	decision: zod
		.enum(['allow', 'deny'])
		.optional()
		.describe(
			option({
				description: 'Decision to filter logs (allow/deny)',
				alias: 'd',
			}),
		),
	maxLogs: zod
		.number()
		.positive()
		.optional()
		.default(1000)
		.describe(
			option({
				description: 'Maximum number of audit logs to process',
				alias: 'm',
			}),
		),
});

type Props = {
	options: zod.infer<typeof options>;
};

export default function Audit({ options }: Props) {
	return (
		<AuthProvider permit_key={options.apiKey} scope={'environment'}>
			<TestRunAuditComponent options={options} />
		</AuthProvider>
	);
}
