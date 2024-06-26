import { GlobalTime } from 'types/actions/globalTime';
import { Tags } from 'types/reducer/trace';

export type Props = {
	start: GlobalTime['minTime'];
	end: GlobalTime['minTime'];
	exceptionType: string[];
	serviceName: string;
	tags: Tags[];
	issueStatus: string[];
	message: string;
};

export type PayloadProps = number;
