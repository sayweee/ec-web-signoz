import './ContextView.styles.scss';

import RawLogView from 'components/Logs/RawLogView';
import LogsContextList from 'container/LogsContextList';
import { ORDERBY_FILTERS } from 'container/QueryBuilder/filters/OrderByFilter/config';
import { ILog } from 'types/api/logs/log';
import { Query, TagFilter } from 'types/api/queryBuilder/queryBuilderData';

interface LogContextProps {
	log: ILog;
	contextQuery: Query | undefined;
	filters: TagFilter | null;
	isEdit: boolean;
}

function ContextView({
	log,
	filters,
	contextQuery,
	isEdit,
}: LogContextProps): JSX.Element {
	// eslint-disable-next-line react/jsx-no-useless-fragment
	if (!contextQuery) return <></>;

	return (
		<div className="log-context-container">
			<LogsContextList
				className="logs-context-list-asc"
				order={ORDERBY_FILTERS.ASC}
				filters={filters}
				isEdit={isEdit}
				log={log}
				query={contextQuery}
			/>
			<RawLogView
				isActiveLog
				isReadOnly
				isTextOverflowEllipsisDisabled={false}
				data={log}
				linesPerRow={1}
			/>
			<LogsContextList
				className="logs-context-list-desc"
				order={ORDERBY_FILTERS.DESC}
				filters={filters}
				isEdit={isEdit}
				log={log}
				query={contextQuery}
			/>
		</div>
	);
}

export default ContextView;
