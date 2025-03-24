import React from 'react';
import { render } from 'ink-testing-library';
import { describe, vi, expect, it } from 'vitest';
import Index from '../source/commands/index';
import delay from 'delay';
import * as keytar from 'keytar';


vi.mock('keytar', () => {
	const demoPermitKey = 'permit_key_'.concat('a'.repeat(97));

	const keytar = {
		setPassword: vi.fn().mockResolvedValue(() => {
			return demoPermitKey
		}),
		getPassword: vi.fn().mockResolvedValue(() => {
			return demoPermitKey
		}),
		deletePassword: vi.fn().mockResolvedValue(demoPermitKey),
	};
	return { ...keytar, default: keytar };
});

describe('index file', () => {
	it('the index file should render', () => {
		const { lastFrame } = render(<Index />);
		expect(lastFrame()?.toString()).toMatch(
			/Run this command with --help for more information/,
		);
	});
});
