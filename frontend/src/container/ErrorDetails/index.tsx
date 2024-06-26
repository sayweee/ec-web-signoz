import './styles.scss';

import { Button, Divider, message, Modal, Space, Typography } from 'antd';
import getNextPrevId from 'api/errors/getNextPrevId';
import axios from 'axios';
import Editor from 'components/Editor';
import { ResizeTable } from 'components/ResizeTable';
import CreateIssue from 'container/AllError/createIssue';
import { getNanoSeconds } from 'container/AllError/utils';
import dayjs from 'dayjs';
import { useNotifications } from 'hooks/useNotifications';
import createQueryParams from 'lib/createQueryParams';
import history from 'lib/history';
import { urlKey } from 'pages/ErrorDetails/utils';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { Link, useLocation } from 'react-router-dom';
import { PayloadProps as GetByErrorTypeAndServicePayload } from 'types/api/errors/getByErrorTypeAndService';

import { keyToExclude } from './config';
import { DashedContainer, EditorContainer, EventContainer } from './styles';

/* eslint-disable */
function ErrorDetails(props: ErrorDetailsProps): JSX.Element {
	const [sourceCodeLoading, setSourceCodeLoading] = useState<boolean>(false);
	const [messageApi, contextHolder] = message.useMessage();
	const { idPayload } = props;
	const { t } = useTranslation(['errorDetails', 'common']);
	const { search, pathname } = useLocation();

	const params = useMemo(() => new URLSearchParams(search), [search]);

	const errorId = params.get(urlKey.errorId);
	const serviceName = params.get(urlKey.serviceName);
	const errorType = params.get(urlKey.exceptionType);
	const timestamp = params.get(urlKey.timestamp);
	// const issueLink = params.get(urlKey.issueLink);

	const { data: nextPrevData, status: nextPrevStatus } = useQuery(
		[
			idPayload.errorId,
			idPayload.groupID,
			idPayload.timestamp,
			errorId,
			serviceName,
			errorType,
			timestamp,
		],
		{
			queryFn: () =>
				getNextPrevId({
					errorID: errorId || idPayload.errorId,
					groupID: idPayload.groupID,
					timestamp: timestamp || getNanoSeconds(idPayload.timestamp),
				}),
		},
	);

	const errorDetail = idPayload;

	const [stackTraceValue] = useState(errorDetail.exceptionStacktrace);

	const columns = useMemo(
		() => [
			{
				title: 'Key',
				width: 100,
				dataIndex: 'key',
				key: 'key',
			},
			{
				title: 'Value',
				dataIndex: 'value',
				width: 100,
				key: 'value',
			},
		],
		[],
	);

	const { notifications } = useNotifications();

	const onClickErrorIdHandler = async (
		id: string,
		timestamp: string,
	): Promise<void> => {
		try {
			if (id.length === 0) {
				notifications.error({
					message: 'Error Id cannot be empty',
				});
				return;
			}

			const queryParams = {
				groupId: idPayload.groupID,
				timestamp: getNanoSeconds(timestamp),
				errorId: id,
			};

			history.replace(`${pathname}?${createQueryParams(queryParams)}`);
		} catch (error) {
			notifications.error({
				message: t('something_went_wrong'),
			});
		}
	};

	const timeStamp = dayjs(errorDetail.timestamp);

	const data: { key: string; value: string }[] = Object.keys(errorDetail)
		.filter((e) => !keyToExclude.includes(e))
		.map((key) => ({
			key,
			value: errorDetail[key as keyof GetByErrorTypeAndServicePayload],
		}));

	// const onClickTraceHandler = (): void => {
	// 	history.push(`/trace/${errorDetail.traceID}?spanId=${errorDetail.spanID}`);
	// };

	const clickCheckSourceDetail = async (): Promise<void> => {
		const errorReport = JSON.parse(errorDetail.exceptionStacktrace || '{}');
		setSourceCodeLoading(true);
		axios
			// .post('http://localhost:9331/capi/sourcemap/searchErrDetail', {
			.post(`${process.env.SERVER_API_HOST}/capi/sourcemap/searchErrDetail`, {
				fileName: errorReport.fileName,
				line: errorReport.lineNumber || errorReport.line,
				column: errorReport.columnNumber || errorReport.column,
				projectId: errorReport.projectId,
				env: errorReport.env,
			})
			.then(({ data }) => {
				setSourceCodeLoading(false);
				if (data.result) {
					Modal.info({
						width: 600,
						title: 'Code Detail',
						content: <p dangerouslySetInnerHTML={{ __html: data.msg }} />,
					});
					return;
				}
				messageApi.open({
					type: 'warning',
					content: data.msg,
				});
			})
			.catch((error) => {
				setSourceCodeLoading(false);
				console.warn('clickCheckSourceDetailError', error);
			});
	};

	const showCheckBtn = useMemo(() => {
		const errorReport = JSON.parse(errorDetail.exceptionStacktrace || '{}');
		return (
			errorReport.projectId &&
			(errorReport.columnNumber || errorReport.column) &&
			(errorReport.lineNumber || errorReport.line) &&
			errorReport.fileName &&
			['Unhandled_Rejection', 'JS_ERROR'].includes(errorDetail.exceptionType) &&
			/weeecdn|sayweee|local|localhost/.test(errorReport.fileName) &&
			/\.js/.test(errorReport.fileName)
		);
	}, [errorDetail.exceptionStacktrace, errorDetail.exceptionType]);

	return (
		<>
			{contextHolder}
			<Typography>{errorDetail.exceptionType}</Typography>
			<Typography>{errorDetail.exceptionMessage}</Typography>
			<Divider />

			<EventContainer>
				<div>
					<Typography>Event {errorDetail.errorId}</Typography>
					<Typography>{timeStamp.format('MMM DD YYYY hh:mm:ss A')}</Typography>
				</div>
				<div>
					<Space align="end" direction="horizontal">
						<Button
							loading={nextPrevStatus === 'loading'}
							disabled={nextPrevData?.payload?.prevErrorID.length === 0}
							onClick={(): Promise<void> =>
								onClickErrorIdHandler(
									nextPrevData?.payload?.prevErrorID || '',
									nextPrevData?.payload?.prevTimestamp || '',
								)
							}
						>
							{t('older')}
						</Button>
						<Button
							loading={nextPrevStatus === 'loading'}
							disabled={nextPrevData?.payload?.nextErrorID.length === 0}
							onClick={(): Promise<void> =>
								onClickErrorIdHandler(
									nextPrevData?.payload?.nextErrorID || '',
									nextPrevData?.payload?.nextTimestamp || '',
								)
							}
						>
							{t('newer')}
						</Button>
					</Space>
				</div>
			</EventContainer>

			{/* <DashedContainer>
				<Typography>{t('see_trace_graph')}</Typography>
				<Button onClick={onClickTraceHandler} type="primary">
					{t('see_error_in_trace_graph')}
				</Button>
			</DashedContainer> */}

			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<Typography.Title level={4}>{t('stack_trace')}</Typography.Title>
				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-start',
						alignItems: 'center',
					}}
				>
					<div style={{ marginRight: 10 }}>
						{/* {errorDetail.issueLink ? (
							<Button type="link" href={errorDetail.issueLink} target="_blank">
								Issue Link
							</Button>
						) : (
							<Button type="primary">Create Issue</Button>
						)} */}
						<CreateIssue
							issueLink={errorDetail.issueLink || ''}
							record={{
								serviceName: errorDetail.serviceName,
								exceptionType: errorDetail.exceptionType,
								exceptionMessage: errorDetail.exceptionMessage,
								time: errorDetail.timestamp,
								groupID: errorDetail.groupID,
							}}
							refresh={() => {
								props.refresh?.();
							}}
						/>
					</div>
					{showCheckBtn ? (
						<Button
							onClick={clickCheckSourceDetail}
							type="primary"
							loading={sourceCodeLoading}
						>
							check source code
						</Button>
					) : null}
				</div>
			</div>

			<div className="error-container">
				<Editor
					value={stackTraceValue}
					readOnly
					language="json"
					options={{
						// wordBasedSuggestions: 'allDocuments',
						// wordSeparators: '~!@#$%^&*()-=+[{]}|;:\'",.<>/?',
						wordWrap: 'on',
						// wordWrapBreakAfterCharacters: '\t})]?|&,;',
						// wordWrapBreakBeforeCharacters: '{([+',
						wrappingIndent: 'same',
					}}
				/>
			</div>

			<EditorContainer>
				<Space direction="vertical">
					<ResizeTable columns={columns} tableLayout="fixed" dataSource={data} />
				</Space>
			</EditorContainer>
		</>
	);
}

interface ErrorDetailsProps {
	idPayload: GetByErrorTypeAndServicePayload;
	refresh?: () => void;
}

export default ErrorDetails;
