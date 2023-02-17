import { useState, useEffect, useRef } from 'react';
import { readString } from 'react-papaparse';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import './App.css';

// data
import usersCSV from './data/users.csv';
import paymentsCSV from './data/payments-sorted.csv';

export const App = () => {

	const [users, setUsers] = useState([]);
	const [payments, setPayments] = useState([]);
	const [dataLoaded, setDataLoaded] = useState(false)

	const [foo, SetFoo] = useState(0);
	
	const loadData = () => {

		console.log("Data is being loaded!");

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

		console.time('Read Users CSV');
		readString(usersCSV, usersConfig);
		console.timeEnd('Read Users CSV');	

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

		console.time('Read Payments CSV');
		readString(paymentsCSV, paymentsConfig);
		console.timeEnd('Read Payments CSV');	
	}

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {	
		if (users.data !== undefined && payments.data !== undefined) {
			setDataLoaded(true);
		}
	}, [users, payments]);


	const test = () => {
		const newPayments = [];
		newPayments.data = [...payments.data];
		newPayments.data.splice(0, 100000);
		setPayments(newPayments);
		//setPayments(payments);
		SetFoo(foo + 1);
	}

	return (
		<div>
			{dataLoaded === false ? "Loading data..." : <MRRChart payments={payments} foo={foo} />}
			<button onClick={() => test()}>TEST</button>
		</div>
	);
}




export const MRRChart = (props) => {

	let testValue = props.foo;

	const chartRef = useRef();
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
			ordinal: true,
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
	

	const handleSeriesClick = (event, series) => {

		const year = new Date(event.point.category).getFullYear();

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

	useEffect(() => {

		console.time('Parse Time:');

		const payments = [];
		for (let i = 0; i < props.payments.data.length - 1; i++) {
			const data = props.payments.data[i];		
			payments.push([data.timestamp, data.value]);
		}
		
		payments.sort((a, b) => a[0] - b[0]);

		console.timeEnd('Parse Time:');

		console.log(payments.length);

		setChartOptions({ 
			series: [{
				data: payments
			}],
			plotOptions: {
				series: {
					events: {
						click: function(e) {
							handleSeriesClick(e, payments)
						}
					}
				}
			}
		});

	}, [props.payments]);

	return (
		<div>
			<HighchartsReact
				highcharts={Highcharts}
				options={chartOptions}
				ref={chartRef}
			/>
			<div>{testValue}</div>
		</div>
	);
}