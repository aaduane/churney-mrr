import { useState, useEffect, useRef } from 'react';
import { readString } from 'react-papaparse';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import './App.css';

// data
import usersCSV from './data/users.csv';
import paymentsCSV from './data/payments.csv';

export const App = () => {

	const [users, setUsers] = useState([]);
	const [payments, setPayments] = useState([]);
	const [dataLoaded, setDataLoaded] = useState(false)
	
	const loadData = () => {

		// read users.csv, parse to json, and set state
		const usersConfig = {
			download: true,
			complete: results => {
				const json = [];
				for (let i = 1; i < results.data.length; i++) {
					const row = results.data[i];		
					json.push({
						"uid": row[0],
						"country": row[1],
						"ageGroup": row[2],
						"productCategory": row[3],
						"subscriptionFrequency": parseInt(row[4]),
					})
				}
				setUsers({ data: json });
			},
			error: (error) => {
				alert('Error while parsing CSV: ', error);
			}
		};	
		readString(usersCSV, usersConfig);

		// read payments.csv, parse to json, and set state
		const paymentsConfig = {
			download: true,
			complete: results => {
				const json = [];
				for (let i = 1; i < results.data.length; i++) {
					const row = results.data[i];		
					json.push({
						"uid": row[0],
						"timestamp": Date.parse(row[1]),
						"value": parseInt(row[2])
					})
				}
				setPayments({ data: json });
			},
			error: (error) => {
				alert('Error while parsing CSV: ', error);
			}
		};
		readString(paymentsCSV, paymentsConfig);

	}

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {	
		if (users.data !== undefined && payments.data !== undefined) {
			setDataLoaded(true);
		}
	}, [users, payments]);

	return (
		<div>
			{dataLoaded === false ? "Loading data..." : <PaymentsChart data={payments.data} />}
		</div>
	);
}




export const PaymentsChart = (props) => {

	const chartRef = useRef();

	const [series, setSeries] = useState([]);

	useEffect(() => {
		const payments = [];
		for (let i = 0; i < props.data.length - 1; i++) {
			const data = props.data[i];		
			payments.push([data.timestamp, data.value]);
		}
		payments.sort((a, b) => a[0] - b[0]);
		setSeries(payments);
	}, [props.data]);

	useEffect(() => {
		if (series.length > 0) {
			setChartOptions({ 
				series: [{
					data: series
				}],
				plotOptions: {
					series: {
						events: {
							click: handleSeriesClick
						}
					}
				},
			});
		}	
		
	}, [series]);

	const handleSeriesClick = (e) => {

		const year = new Date(e.point.category).getFullYear();

		const filteredData = [];
		series.forEach(data => {
			const dataYear = new Date(data[0]).getFullYear();
			if ( dataYear === year) {
				filteredData.push(data);
			}
		})

		const start = Date.UTC(year, 0, 1);
		const end = Date.UTC(year, 11, 31, 23, 59, 59);

		console.log(new Date(start).toISOString());
		console.log(new Date(end).toISOString());

		setChartOptions({
			xAxis: {
				ordinal: true
			},
			plotOptions: {
				series: {
					dataGrouping: {
						units: [['month', null]]
					}
				}
			},
			series: [{
				data: filteredData
			}],
		});

		chartRef.current.chart.xAxis[0].setExtremes(start, end);
	}

	const [chartOptions, setChartOptions] = useState({
		title: {
			text: "Monthly Recurring Revenue"
		},
		credits: {
			enabled: false
		},
		accessibility: {
			enabled: false
		},
		xAxis: {
			type: "datetime",
			title: {
				text: "Time"
			},
		},
		plotOptions: {
			series: {
				boostThreshold: 1,
				dataGrouping: {
					enabled: true,
					forced: true,
					units: [['year', null]]
				}
			}
		},
		series: [{
			type: 'column',
			cursor: 'pointer',
			name: "Payments"
		}]
	});

	return (
		<div>
			<HighchartsReact
				highcharts={Highcharts}
				options={chartOptions}
				ref={chartRef}
			/>
		</div>
	);
}

function usePrevious(value) {
	const ref = useRef();
	useEffect(() => {
		ref.current = value; 
	},[value]); 
	return ref.current; 
}