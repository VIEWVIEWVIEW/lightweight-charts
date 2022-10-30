import { Coordinate } from '../model/coordinate';
import { CloudPricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';
import { BrokenCloudLineItem } from './cloud-area-renderer';

import { ScaledRenderer } from './scaled-renderer';

export type CloudLineItem = TimedValue & CloudPricedValue;

export interface PaneRendererBrokenAreaData {
	items: BrokenCloudLineItem[];

	color: string;
	strokeColor: string;
	strokeWidth: number;
	compositeOperation?: string;

	width: Coordinate;

	barWidth: number;

	visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneRendererBrokenArea extends ScaledRenderer {
	public extensionsBoundaries: { [id: string]: number } = {};
	protected _data: PaneRendererBrokenAreaData | null = null;

	public setData(data: PaneRendererBrokenAreaData): void {
		this._data = data;
	}

	// eslint-disable-next-line complexity
	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (
			this._data === null ||
			this._data.items.length === 0 ||
			this._data.visibleRange === null
		) {
			return;
		}

		if (this._data.compositeOperation) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			ctx.globalCompositeOperation = this._data.compositeOperation as any;
		}

		const chunks: [number, number][] = [];
		let chunkStart = this._data.visibleRange ? this._data.visibleRange.from : 0;
		const chunkEnd = this._data.visibleRange ? this._data.visibleRange.to : 0;
		let lastTime = null;
		let lastColor = null;
		for (
			let i = chunkStart;
			i < chunkEnd;
			++i
		) {
			const currItem = this._data.items[i];

			if (lastTime !== null && (currItem.time - lastTime > 1 || currItem.color !== lastColor)) {
				chunks.push([chunkStart, currItem.time - lastTime > 1 ? i - 1 : i]);
				chunkStart = i;
			}

			lastTime = currItem.time;
			lastColor = currItem.color;
		}

		chunks.push([chunkStart, chunkEnd ? chunkEnd - 1 : 0]);

		ctx.strokeStyle = this._data.strokeColor;
		ctx.lineWidth = this._data.strokeWidth;
		ctx.fillStyle = this._data.color;

		for (let i = 0; i < chunks.length; ++i) {
			const fromItemIndex = chunks[i][0];
			const toItemIndex = chunks[i][1];

			if (typeof this._data.items[fromItemIndex].label !== 'undefined') {
				ctx.fillStyle = this._data.strokeColor;
				ctx.fillText(this._data.items[fromItemIndex].label as string, this._data.items[fromItemIndex].x, this._data.items[fromItemIndex].higherY - 4);
				ctx.fillStyle = this._data.color;
			}

			if (typeof this._data.items[fromItemIndex].color !== 'undefined') {
				ctx.fillStyle = this._data.items[fromItemIndex].color as string;
			}

			ctx.beginPath();

			ctx.moveTo(
				this._data.items[fromItemIndex].x,
				this._data.items[fromItemIndex].higherY
			);

			if (this._data.items[0].extendRight && this._data.items[fromItemIndex].higherY === this._data.items[fromItemIndex].lowerY && this._data.items.length === 1) {
				ctx.lineTo(this._data.items[toItemIndex].end, this._data.items[toItemIndex].higherY);
				ctx.lineTo(this._data.items[toItemIndex].end, this._data.items[toItemIndex].lowerY);

				if (this._data.strokeWidth) {
					ctx.stroke();
				}
				continue;
			}

			for (let j = fromItemIndex; j <= toItemIndex; j++) {
				ctx.lineTo(this._data.items[j].x, this._data.items[j].higherY);
			}

			if (this._data.items[0].extendRight) {
				ctx.lineTo(this._data.items[toItemIndex].end, this._data.items[toItemIndex].higherY);
				ctx.lineTo(this._data.items[toItemIndex].end, this._data.items[toItemIndex].lowerY);
			}

			for (let j = toItemIndex; j >= fromItemIndex; --j) {
				ctx.lineTo(this._data.items[j].x, this._data.items[j].lowerY);
			}

			ctx.closePath();

			if (this._data.color) {
				ctx.fill();
			}

			if (this._data.strokeWidth) {
				ctx.stroke();
			}
		}
	}
}
