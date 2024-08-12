import { ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import type { TableProps, UploadFile, UploadProps } from 'antd';
import {
	Button,
	Col,
	DatePicker,
	Form,
	Input,
	message,
	Modal,
	Row,
	Select,
	Space,
	Table,
	Tag,
	Tooltip,
	Upload,
} from 'antd';
import axios from 'axios';
import { ResizeTable } from 'components/ResizeTable';
import dayjs, { Dayjs } from 'dayjs';
import { useIsDarkMode } from 'hooks/useDarkMode';
import useUrlQuery from 'hooks/useUrlQuery';
import { camelCase } from 'lodash-es';
import { useEffect, useState } from 'react';

/* eslint-disable */
export interface LoganTableType {
	id: number;
	name: string;
	isLogan: number;
	platform: number;
	fileLink: string;
	createdAt: string;
}

interface SearchParamType {
	name?: string;
	isLogan?: string;
	platform?: string;
	timeSelect?: number[];
}

type Pagination = {
	current: number;
	pageSize: number;
};

interface FinalSearchParamType extends SearchParamType {
	page: Pagination;
}
type OnChange = NonNullable<TableProps<LoganTableType>['onChange']>;

const { RangePicker } = DatePicker;

function Logan(): JSX.Element {
	const [modal, contextHolder] = Modal.useModal();
	const [messageApi] = message.useMessage();
	const isDarkMode = useIsDarkMode();
	const [timeSelect, setTimeSelect] = useState<Dayjs[]>([]);
	const [searchLoading, setSearchLoading] = useState<boolean>(false);
	const [tableData, setTableData] = useState<LoganTableType[]>([]);
	const [tableTotal, setTableTotal] = useState<number>(0);
	const [pagination, setPagination] = useState<Pagination>({
		current: 1,
		pageSize: 20,
	});
	const [searchParam, setSearchParam] = useState<SearchParamType>();

	const [fileList, setFileList] = useState<UploadFile[]>([]);
	const [uploading, setUploading] = useState(false);
	const params = useUrlQuery();
	const queryTest = params.get('test');

	const deleteTask = async (id: number) => {
		try {
			const { data } = await axios.post(
				`${process.env.SERVER_API_HOST}/capi/logan/logDelete`,
				{
					id,
				},
			);
			if (data.result) {
				messageApi.open({
					type: 'success',
					content: 'delete success',
				});
				return true;
			}
			messageApi.open({
				type: 'warning',
				content: data.message,
			});
			return false;
		} catch (error) {
			console.log('deleteTaskError', error);
			messageApi.open({
				type: 'error',
				content: 'Update Error',
			});
			return false;
		}
	};

	const handleDelete = (record: LoganTableType) => {
		modal.confirm({
			title: 'Confirm',
			icon: <ExclamationCircleOutlined />,
			content: 'You sure to delete current record?',
			async onOk() {
				const res = await deleteTask(record.id);
				if (res) handleSearch();
			},
			onCancel() {},
		});
	};

	const columns: TableProps<LoganTableType>['columns'] = [
		{
			title: 'File Name',
			dataIndex: 'name',
			key: 'name',
			render: (value, record) => {
				if (value?.length > 8) {
					return (
						<Tooltip title={value}>
							<span>{`${value.slice(0, 8)}...`}</span>
						</Tooltip>
					);
				}
				return <span>{value}</span>;
			},
		},
		{
			title: 'Create Time',
			dataIndex: 'createdAt',
			key: 'createdAt',
			render: (value, record) => (
				<span>{dayjs(value).format('MM/DD/YYYY HH:mm:ss')}</span>
			),
		},
		{
			title: 'Is Logan',
			dataIndex: 'isLogan',
			key: 'isLogan',
			render: (value, record) => <span>{value === 1 ? 'Yes' : 'No'}</span>,
		},
		{
			title: 'Platform',
			dataIndex: 'platform',
			key: 'platform',
			render: (value, record) => {
				const lib = {
					'1': 'iOS',
					'2': 'Android',
					'3': 'flutter',
				};
				return <span>{(lib as any)[value] || 'unknow'}</span>;
			},
		},
		{
			title: 'File Address',
			dataIndex: 'fileLink',
			key: 'fileLink',
			render: (value, record) => {
				return (
					<div>
						<a
							href={`${process.env.SERVER_API_HOST}/capi/logan/logDownload?id=${record.id}`}
							target="_blank"
							style={{ display: 'block' }}
						>
							{record.name}
						</a>
					</div>
				);
			},
		},
		{
			title: 'Operation',
			key: 'action',
			render: (_, record) => (
				<Space size="middle">
					<a onClick={() => handleDelete(record)}>Delete</a>
				</Space>
			),
		},
	];

	const formatDataToPage = (param: { [x: string]: any }) => {
		const finalParam = {} as any;
		for (const key in param as any) {
			if (String(param[key])) {
				finalParam[camelCase(key)] = param[key];
			}
		}
		return finalParam;
	};

	const searchLogan = async (searchParam: any) => {
		try {
			setSearchLoading(true);
			const { data } = await axios.post(
				`${process.env.SERVER_API_HOST}/capi/logan/logSearchList`,
				searchParam,
			);
			if (data.result) {
				const list =
					data.data?.list?.map((item: any) => {
						return formatDataToPage(item);
					}) || [];
				setTableData(list);
				setTableTotal(data?.data?.total || 0);
			}
		} catch (error) {
			console.error('searchAllRulesError', error);
		} finally {
			setSearchLoading(false);
		}
	};

	const handleTableChange: OnChange = (page, filters, sorter) => {
		setPagination((prev) => ({
			...prev,
			current: page.current || 1,
		}));
		const tmpPag: Pagination = {
			current: page.current || 0,
			pageSize: page.pageSize || 0,
		};
		handleSearch(tmpPag);
	};

	const handleSearch = (paramPage?: Pagination) => {
		const param: FinalSearchParamType = {
			...searchParam,
			page: paramPage || pagination,
		};

		for (const key in param) {
			if (!String((param as any)[key])) {
				delete (param as any)[key];
			}
		}
		if (timeSelect.length) {
			Object.assign(param, {
				// timeSelect: timeSelect.map((item) => dayjs(item).format('YYYY-MM-DD')),
				timeSelect: timeSelect.map((item) => dayjs(item).valueOf()),
			});
		}
		searchLogan(param);
	};

	const handleInput = (type: string, value: string | number) => {
		setSearchParam((prev) => {
			return {
				...prev,
				[type]: value,
			};
		});
	};

	useEffect(() => {
		handleSearch();
	}, []);

	const handleUpload = () => {
		const formData = new FormData();
		fileList.forEach((file) => {
			formData.append('files', file as any);
		});
		formData.append('isLogan', '0');
		formData.append('plantform', '2');
		// formData.append('loganId', '0');

		setUploading(true);
		// You can use any AJAX library you like
		fetch(`${process.env.SERVER_API_HOST}/capi/logan/logUpload`, {
			method: 'POST',
			body: formData,
		})
			.then((res) => res.json())
			.then(() => {
				setFileList([]);
				message.success('upload successfully.');
			})
			.catch(() => {
				message.error('upload failed.');
			})
			.finally(() => {
				setUploading(false);
			});
	};

	const uploadProps: UploadProps = {
		onRemove: (file) => {
			const index = fileList.indexOf(file);
			const newFileList = fileList.slice();
			newFileList.splice(index, 1);
			setFileList(newFileList);
		},
		beforeUpload: (file) => {
			setFileList([...fileList, file]);

			return false;
		},
		fileList,
	};

	return (
		<>
			{contextHolder}
			<h1 style={isDarkMode ? { color: 'white' } : { color: 'black' }}>
				App Logs
			</h1>
			{!!queryTest && (
				<>
					<Upload {...uploadProps}>
						<Button>Select File</Button>
					</Upload>
					<Button
						type="primary"
						onClick={handleUpload}
						disabled={fileList.length === 0}
						loading={uploading}
						style={{ marginTop: 16 }}
					>
						{uploading ? 'Uploading' : 'Start Upload'}
					</Button>
				</>
			)}

			<div>
				<Form name="search-form" layout="inline">
					<Form.Item label="File Name" style={{ marginBottom: 10 }}>
						<Input
							style={{ width: 160 }}
							placeholder="Please input"
							allowClear
							value={searchParam?.name}
							onChange={(e) => handleInput('name', e.target.value)}
						/>
					</Form.Item>

					<Form.Item label="Platform" style={{ marginBottom: 10 }}>
						<Select
							allowClear
							placeholder="Select Platform"
							style={{ width: 180 }}
							onChange={(value: string) => {
								handleInput('platform', value);
							}}
							options={[
								{
									value: 1,
									label: 'Ios',
								},
								{
									value: 2,
									label: 'Android',
								},
							]}
						/>
					</Form.Item>
					<Form.Item label="Is Logan" style={{ marginBottom: 10 }}>
						<Select
							allowClear
							placeholder="Select is Logan"
							style={{ width: 180 }}
							onChange={(value: string) => {
								handleInput('isLogan', value);
							}}
							options={[
								{
									value: 1,
									label: 'Yes',
								},
								{
									value: 0,
									label: 'No',
								},
							]}
						/>
					</Form.Item>
					<Form.Item label="Created Time" style={{ marginBottom: 10 }}>
						<RangePicker
							format="YYYY-MM-DD HH:mm:ss"
							showTime
							popupStyle={
								isDarkMode ? { backgroundColor: 'black' } : { backgroundColor: 'white' }
							}
							defaultValue={[timeSelect[0], timeSelect[1]]}
							onChange={(value, dateString: [string, string]) => {
								if (Array.isArray(value)) {
									setTimeSelect(value as [Dayjs, Dayjs]);
								} else {
									setTimeSelect([]);
								}
							}}
						/>
					</Form.Item>

					<Form.Item label=" " colon={false} style={{ marginBottom: 10 }}>
						<Button type="primary" onClick={() => handleSearch()}>
							Search
						</Button>
					</Form.Item>
				</Form>
			</div>
			<div
				style={{
					display: 'flex',
					justifyContent: 'flex-end',
					alignItems: 'center',
					marginBottom: 10,
				}}
			></div>
			<ResizeTable
				columns={columns}
				rowKey={(record) => record.id}
				dataSource={tableData}
				loading={searchLoading}
				pagination={{
					...pagination,
					total: tableTotal,
				}}
				onChange={handleTableChange}
			/>
		</>
	);
}

export default Logan;
