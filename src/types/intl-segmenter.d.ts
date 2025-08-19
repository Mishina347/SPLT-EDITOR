// Intl.Segmenterの型定義
declare namespace Intl {
	class Segmenter {
		constructor(
			locales?: string | string[],
			options?: {
				granularity?: 'grapheme' | 'word' | 'sentence'
			}
		)

		segment(input: string): Segments
	}

	interface Segments extends Iterable<SegmentData> {
		[Symbol.iterator](): Iterator<SegmentData>
	}

	interface SegmentData {
		segment: string
		index: number
		input: string
		isWordLike?: boolean
	}
}
