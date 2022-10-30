import { undefinedIfNull } from '../../helpers/strict-type-checks';

import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { PlotRowValueIndex } from '../../model/plot-data';
import { CloudPricedValue, PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { SeriesPlotRow } from '../../model/series-data';
import { TimedValue, visibleTimedValues } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';

import { SeriesPaneViewBase } from './series-pane-view-base';

export abstract class CloudAreaPaneViewBase<TSeriesType extends 'CloudArea' | 'BrokenArea', ItemType extends TimedValue & CloudPricedValue> extends SeriesPaneViewBase<TSeriesType, ItemType> {
	protected constructor(series: Series<TSeriesType>, model: ChartModel) {
		super(series, model, true);
	}

	protected _convertToCoordinates(priceScale: PriceScale, timeScale: TimeScale, firstValue: number): void {
		timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
		priceScale.cloudPointsArrayToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
	}

	protected _updateOptions(): void {}

	protected override _updatePoints(): void {
		const priceScale = this._series.priceScale();
		const timeScale = this._model.timeScale();

		this._clearVisibleRange();

		if (timeScale.isEmpty() || priceScale.isEmpty()) {
			return;
		}

		const visibleBars = timeScale.visibleStrictRange();
		if (visibleBars === null) {
			return;
		}

		if (this._series.bars().size() === 0) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}

		this._itemsVisibleRange = visibleTimedValues(this._items, visibleBars, this._extendedVisibleRange);
		this._convertToCoordinates(priceScale, timeScale, firstValue.value);
	}

	protected _fillRawPoints(): void {
		this._items = this._series.bars().rows().map((row: SeriesPlotRow<TSeriesType>) => {
			const higherValue = row.value[PlotRowValueIndex.High] as BarPrice;
			const lowerValue = row.value[PlotRowValueIndex.Low] as BarPrice;
			return {
				time: row.index,
				higherPrice: higherValue,
				lowerPrice: lowerValue,
				x: NaN as Coordinate,
				higherY: NaN as Coordinate,
				lowerY: NaN as Coordinate,
			};
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		}) as any;
	}
}
