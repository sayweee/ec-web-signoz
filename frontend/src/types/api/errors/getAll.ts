import { GlobalTime } from 'types/actions/globalTime';
import { Tags } from 'types/reducer/trace';

export type Order = 'ascending' | 'descending';
export type OrderBy =
	| 'serviceName'
	| 'exceptionCount'
	| 'lastSeen'
	| 'firstSeen'
	| 'exceptionType';

export interface Props {
	start: GlobalTime['minTime'];
	end: GlobalTime['maxTime'];
	order?: Order;
	orderParam?: OrderBy;
	limit?: number;
	offset?: number;
	exceptionType: string[];
	serviceName?: string;
	tags?: Tags[];
	issueStatus: string[];
	message: string;
}

export interface Exception {
	exceptionType: string;
	exceptionMessage: string;
	exceptionCount: number;
	lastSeen: string;
	firstSeen: string;
	serviceName: string;
	groupID: string;
	issueStatus?: string[];
	issueLink?: string;
}

export type PayloadProps = Exception[];
