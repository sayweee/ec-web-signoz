package common

import (
	"math"

	v3 "go.signoz.io/signoz/pkg/query-service/model/v3"
)

func AdjustedMetricTimeRange(start, end, step int64, aggregaOperator v3.TimeAggregation) (int64, int64) {
	start = start - (start % (step * 1000))
	// if the query is a rate query, we adjust the start time by one more step
	// so that we can calculate the rate for the first data point
	if aggregaOperator.IsRateOperator() {
		start -= step * 1000
	}
	adjustStep := int64(math.Min(float64(step), 60))
	end = end - (end % (adjustStep * 1000))
	return start, end
}
