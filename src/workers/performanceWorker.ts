// パフォーマンス監視用Web Worker
interface PerformanceMessage {
	type: 'MONITOR_RENDER' | 'MONITOR_MEMORY' | 'ANALYZE_PERFORMANCE'
	data: any
}

interface PerformanceMetrics {
	renderTime: number
	memoryUsage?: number
	timestamp: number
	componentName: string
}

class PerformanceMonitor {
	private metrics: PerformanceMetrics[] = []
	private readonly MAX_METRICS = 1000

	addMetric(metric: PerformanceMetrics) {
		this.metrics.push(metric)

		// メトリクスの数を制限
		if (this.metrics.length > this.MAX_METRICS) {
			this.metrics = this.metrics.slice(-this.MAX_METRICS)
		}
	}

	analyzePerformance(): any {
		if (this.metrics.length === 0) {
			return { message: 'No performance data available' }
		}

		const renderTimes = this.metrics.map(m => m.renderTime)
		const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
		const maxRenderTime = Math.max(...renderTimes)
		const minRenderTime = Math.min(...renderTimes)

		// パフォーマンス警告の分析
		const slowRenders = this.metrics.filter(m => m.renderTime > 16).length
		const criticalRenders = this.metrics.filter(m => m.renderTime > 33).length

		return {
			totalMetrics: this.metrics.length,
			averageRenderTime: avgRenderTime.toFixed(2),
			maxRenderTime: maxRenderTime.toFixed(2),
			minRenderTime: minRenderTime.toFixed(2),
			slowRenders,
			criticalRenders,
			performanceScore: this.calculatePerformanceScore(avgRenderTime),
			recommendations: this.generateRecommendations(avgRenderTime, slowRenders, criticalRenders),
		}
	}

	private calculatePerformanceScore(avgRenderTime: number): string {
		if (avgRenderTime <= 16) return 'Excellent (60fps+)'
		if (avgRenderTime <= 33) return 'Good (30fps+)'
		if (avgRenderTime <= 50) return 'Fair (20fps+)'
		return 'Poor (<20fps)'
	}

	private generateRecommendations(
		avgRenderTime: number,
		slowRenders: number,
		criticalRenders: number
	): string[] {
		const recommendations: string[] = []

		if (avgRenderTime > 16) {
			recommendations.push('Consider using React.memo for expensive components')
			recommendations.push('Implement useMemo and useCallback for expensive calculations')
			recommendations.push('Use React.lazy for code splitting')
		}

		if (slowRenders > 0) {
			recommendations.push('Optimize re-renders with proper dependency arrays')
			recommendations.push('Consider using useDeferredValue for non-critical updates')
		}

		if (criticalRenders > 0) {
			recommendations.push('Immediate attention required: Component is blocking main thread')
			recommendations.push('Consider moving heavy calculations to Web Workers')
		}

		return recommendations
	}
}

const monitor = new PerformanceMonitor()

// Worker message handler
self.addEventListener('message', (event: MessageEvent<PerformanceMessage>) => {
	const { type, data } = event.data

	switch (type) {
		case 'MONITOR_RENDER':
			monitor.addMetric(data)
			self.postMessage({
				type: 'METRIC_ADDED',
				data: { success: true },
			})
			break

		case 'ANALYZE_PERFORMANCE':
			const analysis = monitor.analyzePerformance()
			self.postMessage({
				type: 'PERFORMANCE_ANALYSIS',
				data: analysis,
			})
			break

		default:
			console.warn('Unknown performance message type:', type)
	}
})

// 定期的なパフォーマンス分析
setInterval(() => {
	const analysis = monitor.analyzePerformance()
	self.postMessage({
		type: 'PERIODIC_ANALYSIS',
		data: analysis,
	})
}, 30000) // 30秒間隔
