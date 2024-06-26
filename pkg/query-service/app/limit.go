package app

import (
	"sort"
	"strings"

	"go.signoz.io/signoz/pkg/query-service/constants"
	v3 "go.signoz.io/signoz/pkg/query-service/model/v3"
)

// applyMetricLimit applies limit to the metrics query results
func applyMetricLimit(results []*v3.Result, queryRangeParams *v3.QueryRangeParamsV3) {
	// apply limit if any for metrics
	// use the grouping set points to apply the limit

	for _, result := range results {
		builderQueries := queryRangeParams.CompositeQuery.BuilderQueries

		if builderQueries != nil && (builderQueries[result.QueryName].DataSource == v3.DataSourceMetrics) {
			limit := builderQueries[result.QueryName].Limit

			orderByList := builderQueries[result.QueryName].OrderBy
			if limit > 0 {
				if len(orderByList) == 0 {
					// If no orderBy is specified, sort by value in descending order
					orderByList = []v3.OrderBy{{ColumnName: constants.SigNozOrderByValue, Order: "desc"}}
				}
				sort.SliceStable(result.Series, func(i, j int) bool {
					for _, orderBy := range orderByList {
						if orderBy.ColumnName == constants.SigNozOrderByValue {

							// For table type queries (we rely on the fact that one value for row), sort
							// based on final aggregation value
							if len(result.Series[i].Points) == 1 && len(result.Series[j].Points) == 1 {
								if orderBy.Order == "asc" {
									return result.Series[i].Points[0].Value < result.Series[j].Points[0].Value
								} else if orderBy.Order == "desc" {
									return result.Series[i].Points[0].Value > result.Series[j].Points[0].Value
								}
							}

							// For graph type queries, sort based on GroupingSetsPoint
							if result.Series[i].GroupingSetsPoint == nil || result.Series[j].GroupingSetsPoint == nil {
								// Handle nil GroupingSetsPoint, if needed
								// Here, we assume non-nil values are always less than nil values
								return result.Series[i].GroupingSetsPoint != nil
							}
							if orderBy.Order == "asc" {
								return result.Series[i].GroupingSetsPoint.Value < result.Series[j].GroupingSetsPoint.Value
							} else if orderBy.Order == "desc" {
								return result.Series[i].GroupingSetsPoint.Value > result.Series[j].GroupingSetsPoint.Value
							}
						} else {
							// Sort based on Labels map
							labelI, existsI := result.Series[i].Labels[orderBy.ColumnName]
							labelJ, existsJ := result.Series[j].Labels[orderBy.ColumnName]

							if !existsI || !existsJ {
								// Handle missing labels, if needed
								// Here, we assume non-existent labels are always less than existing ones
								return existsI
							}

							if orderBy.Order == "asc" {
								return strings.Compare(labelI, labelJ) < 0
							} else if orderBy.Order == "desc" {
								return strings.Compare(labelI, labelJ) > 0
							}
						}
					}
					// Preserve original order if no matching orderBy is found
					return i < j
				})

				if limit > 0 && len(result.Series) > int(limit) {
					result.Series = result.Series[:limit]
				}
			}
		}
	}
}
