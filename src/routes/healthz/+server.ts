import type { RequestHandler } from './$types';
import os from 'node:os';
import { performance } from 'node:perf_hooks';

export const GET: RequestHandler = () => {
	const memory = process.memoryUsage();
	const cpu = process.cpuUsage();
	const eventLoop = performance.eventLoopUtilization();

	const body = {
		status: 'ok',
		timestamp: new Date().toISOString(),
		uptimeSeconds: process.uptime(),
		memory: {
			rss: memory.rss,
			heapTotal: memory.heapTotal,
			heapUsed: memory.heapUsed,
			external: memory.external
		},
		cpu,
		loadAverage: os.loadavg(),
		eventLoop: {
			utilization: eventLoop.utilization,
			active: eventLoop.active,
			idle: eventLoop.idle
		},
		latencySpikes: [] as string[]
	};

	return new Response(JSON.stringify(body), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store'
		}
	});
};
