import { undefinedIfNull } from '../../helpers/strict-type-checks';
import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { PlotRowValueIndex } from '../../model/plot-data';
import { PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { SeriesPlotRow } from '../../model/series-data';
import { TimeScale } from '../../model/time-scale';
import { PaneRendererBrokenArea, PaneRendererBrokenAreaData } from '../../renderers/broken-area-renderer';
import { BrokenCloudLineItem } from '../../renderers/cloud-area-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { CloudAreaPaneViewBase } from './cloud-area-pane-view-base';

export class SeriesBrokenAreaPaneView extends CloudAreaPaneViewBase<'BrokenArea', BrokenCloudLineItem> {
	private readonly _renderer: CompositeRenderer = new CompositeRenderer();
	private readonly _brokenAreaRenderer: PaneRendererBrokenArea = new PaneRendererBrokenArea();

	public constructor(series: Series<'BrokenArea'>, model: ChartModel) {
		super(series, model);
		this._renderer.setRenderers([this._brokenAreaRenderer]);
	}

	public setExtensionsBoundaries(extensionsBoundaries: {[id: string]: number}): void {
		this._brokenAreaRenderer.extensionsBoundaries = extensionsBoundaries;
	}

	public renderer(height: number, width: number): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		const areaStyleProperties = this._series.options();

		this._makeValid();
		const brokenAreaRenderer: PaneRendererBrokenAreaData = {
			items: this._items,
			color: areaStyleProperties.color,
			strokeColor: areaStyleProperties.strokeColor,
			strokeWidth: areaStyleProperties.strokeWidth,
			compositeOperation: areaStyleProperties.compositeOperation,
			width: width as Coordinate,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		};
		this._brokenAreaRenderer.setData(brokenAreaRenderer);

		return this._renderer;
	}

	protected override _convertToCoordinates(priceScale: PriceScale, timeScale: TimeScale, firstValue: number): void {
		timeScale.indexesToCoordinatesExtensions(this._items, this._brokenAreaRenderer.extensionsBoundaries, undefinedIfNull(this._itemsVisibleRange));
		priceScale.cloudPointsArrayToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
	}

	protected override _fillRawPoints(): void {
		this._items = this._series.bars().rows().map((row: SeriesPlotRow<'BrokenArea'>) => {
			const higherValue = row.value[PlotRowValueIndex.High] as BarPrice;
			const lowerValue = row.value[PlotRowValueIndex.Low] as BarPrice;

			const res: BrokenCloudLineItem = {
				time: row.index,
				higherPrice: higherValue,
				lowerPrice: lowerValue,
				x: NaN as Coordinate,
				end: NaN as Coordinate,
				higherY: NaN as Coordinate,
				lowerY: NaN as Coordinate,
			};

			if (typeof row.color !== 'undefined') {
				res.color = row.color;
			}

			if (typeof row.id !== 'undefined') {
				res.id = row.id;
			}

			if (typeof row.label !== 'undefined') {
				res.label = row.label;
			}

			if (typeof row.extendRight !== 'undefined') {
				res.extendRight = row.extendRight;
			}

			return res;
		});
	}
}
