import { useState, useEffect, useRef, useCallback } from 'react';
import { readString } from 'react-papaparse';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import './App.css';

// data
import usersCSV from './data/users.csv';
import paymentsCSV from './data/payments-sorted.csv';

Highcharts.setOptions({
	//colors: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263', '#6AF9C4'],
	lang: {
		thousandsSep: ','
	}
});

/* ======================================= App ======================================= */
export const App = () => {

	const [users, setUsers] = useState([]);
	const [payments, setPayments] = useState([]);
	const [dataLoaded, setDataLoaded] = useState(false)
	const [rangeFilter, setRangeFilter] = useState({ start: 0, end: 0 });
	const [filteredPayments, setFilteredPayments] = useState([]);
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [categories, setCategories] = useState([]);

	const loadData = () => {

		// console.log("Data is being loaded!"); // debugging

		// read users.csv, parse to json, and set state
		const usersConfig = {
			download: true,
			complete: results => {
				const categories = results.data[0];
				categories.shift();
				setCategories(categories);
				const json = [];
				for (let i = 1; i < results.data.length; i++) {
					const row = results.data[i];
					json.push({
						"uid": row[0],
						"country": row[1],
						"age_group": row[2],
						"product_category": row[3],
						"subscription_frequency": parseInt(row[4]),
					})
				}
				setUsers({ data: json });
			},
			error: (error) => {
				alert('Error while parsing CSV: ', error);
			}
		};

		//console.time('Read Users CSV'); // debugging
		readString(usersCSV, usersConfig);
		//console.timeEnd('Read Users CSV'); // debugging

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

		// console.time('Read Payments CSV'); // debugging
		readString(paymentsCSV, paymentsConfig);
		// console.timeEnd('Read Payments CSV'); // debugging
	}

	// read CSV data into JSON object and set state
	useEffect(() => {
		document.title = "Churney Assignment";
		loadData();
	}, []);

	// set dataLoaded state to true when data is fully loaded
	useEffect(() => {
		if (users.data !== undefined && payments.data !== undefined) {
			setFilteredPayments(payments);
			setFilteredUsers(users);
			setDataLoaded(true);
		}
	}, [users, payments]);

	// filter between start and end time for charts
	useEffect(() => {
		if (rangeFilter.start !== 0 && rangeFilter.end !== 0) {

			// console.log("FILTER S: " + new Date(rangeFilter.start).toUTCString()); // debugging
			// console.log("FILTER E: " + new Date(rangeFilter.end).toUTCString()); // debugging

			// filter payments by start and end time
			const filteredUsersIndex = new Set();
			const filteredPayments = [];
			filteredPayments.data = [];
			for (let i = 0; i < payments.data.length; i++) {
				const payment = payments.data[i];
				if (payment.timestamp > rangeFilter.start && payment.timestamp < rangeFilter.end) {
					filteredPayments.data.push(payment);
					filteredUsersIndex.add(payment.uid);
				}
			}

			// filter users by what payments are filtered
			const filteredUsers = [];
			filteredUsers.data = [];
			for (let i = 0; i < users.data.length; i++) {
				const user = users.data[i];
				if (filteredUsersIndex.has(user.uid)) {
					filteredUsers.data.push(user);
				}
			}

			// set new states
			setFilteredUsers(filteredUsers);
			setFilteredPayments(filteredPayments); // need to sort payments by timestamp before setting ? 
		}
	}, [rangeFilter, payments, users]);

	// roll up after a drilldown 
	const rollUp = () => {
		if (rangeFilter.start !== 0 && rangeFilter.end !== 0) {

			const startMonth = new Date(rangeFilter.start).getUTCMonth();
			const endMonth = new Date(rangeFilter.end).getUTCMonth();

			if (startMonth === endMonth) {

				const year = new Date(rangeFilter.start).getUTCFullYear();
				const start = Date.UTC(year, 0, 1);
				const end = Date.UTC(year, 11, 31, 23, 59, 59);

				console.log(new Date(start).toUTCString());
				console.log(new Date(end).toUTCString());


				const filteredUsersIndex = new Set();
				const filteredPayments = [];
				filteredPayments.data = [];
				for (let i = 0; i < payments.data.length; i++) {
					const payment = payments.data[i];
					if (payment.timestamp > start && payment.timestamp < end) {
						filteredPayments.data.push(payment);
						filteredUsersIndex.add(payment.uid);
					}
				}

				// filter payments by start and end time
				const filteredUsers = [];
				filteredUsers.data = [];
				for (let i = 0; i < users.data.length; i++) {
					const user = users.data[i];
					if (filteredUsersIndex.has(user.uid)) {
						filteredUsers.data.push(user);
					}
				}

				setFilteredUsers(filteredUsers);
				setFilteredPayments(filteredPayments);
				setRangeFilter({ start: start, end: end });
			}
			else {
				setFilteredUsers(users);
				setFilteredPayments(payments);
			}
		}
	}

	return (
		<div id="appWrapper">

			<div>
				{dataLoaded ? null : "Loading data..."}
			</div>

			<div>
				<button onClick={() => rollUp()}>BACK</button>
			</div>

			<div id="mmrWrapper">
				<MRRChart
					payments={filteredPayments}
					setRangeFilter={setRangeFilter}
				/>
			</div>

			<div id="pieChartsWrapper">
				{categories.map(category => (
					<PieChart
						key={category}
						users={filteredUsers}
						category={category}
					/>
				))}
			</div>
		</div>
	)
}

/* ======================================= MRRChart ======================================= */
export const MRRChart = (props) => {

	const chartRef = useRef();

	const [chartOptions, setChartOptions] = useState({
		chart: {
			height: 600
		},
		title: {
			text: "Monthly Recurring Revenue",
		},
		subtitle: {
			text: "Click a data point to drilldown."
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
		yAxis: [{ // Primary yAxis
			labels: {

			},
			title: {
				text: 'Dollars ($)'
			}
		}, { // Secondary yAxis
			title: {
				text: 'Dollars ($)',
				style: {
					color: '#3498db',
				}
			},
			labels: {
				style: {
					color: '#3498db'
				}
			},
			opposite: true
		}],
		tooltip: {
			shared: true,
			valueDecimals: 0,
			valuePrefix: '$',
			//valuePrefix: 'USD',
		},
		plotOptions: {
			series: {
				boostThreshold: 1,
				turboThreshold: 1,
				dataGrouping: {
					enabled: true,
					forced: true,
					units: [['year', null]]
				},
			}
		}
	});

	const handleSeriesClick = useCallback((event, unitGrouping) => {
		if (unitGrouping !== "day") {
			const year = new Date(event.point.category).getUTCFullYear();
			const month = new Date(event.point.category).getUTCMonth();

			let start;
			let end;
			if (unitGrouping === "year") {
				start = Date.UTC(year, 0, 1);
				end = Date.UTC(year, 11, 31, 23, 59, 59);
			}

			if (unitGrouping === "month") {
				start = Date.UTC(year, month, 1);
				end = Date.UTC(year, month + 1, 0, 23, 59, 59);
			}

			props.setRangeFilter({ start: start, end: end });
		}
	}, [props]);

	useEffect(() => {

		// console.time('Parse Time:'); // debugging
		const series = [];
		const churney = [];
		const difference = [];
		if (props.payments.data) {
			for (let i = 0; i < props.payments.data.length; i++) {

				// real payment series 
				const data = props.payments.data[i];
				series.push([data.timestamp, data.value]);

				// churney series creation
				const modifier = Math.floor(Math.random() * (8 - 5 + 1) + 5)
				const modified = data.value * ((100 + modifier) / 100);
				const rounded = Number(modified.toFixed(2));
				churney.push([data.timestamp, rounded]);

				// different series creation
				const differencePayment = Number((rounded - data.value).toFixed(2));
				difference.push([data.timestamp, differencePayment]);
			}
		}
		// console.timeEnd('Parse Time:'); // debugging

		// detect unit for data grouping
		let unitGrouping = "year";
		if (series[0] !== undefined) {
			const firstTimestampYear = new Date(series[0][0]).getUTCFullYear();
			const lastTimestampYear = new Date(series[series.length - 1][0]).getUTCFullYear();
			if (firstTimestampYear === lastTimestampYear) {
				unitGrouping = "month";
				const firstTimestampMonth = new Date(series[0][0]).getUTCMonth();
				const lastTimestampMonth = new Date(series[series.length - 1][0]).getUTCMonth();
				if (firstTimestampMonth === lastTimestampMonth) {
					unitGrouping = "day";
				}
			}
		}

		setChartOptions({
			series: [{
				name: "Original",
				data: series,
				type: 'column',
				color: '#00000',
				cursor: 'pointer'
			},
			{
				name: "Churney",
				data: churney,
				type: 'column',
				cursor: 'pointer',
				color: '#9bfa91'
			},
			{
				name: "Increase",
				data: difference,
				type: 'spline',
				cursor: 'pointer',
				yAxis: 1,
				color: '#3498db',
				dataGrouping: {
					approximation: "sum"
				}
			}],
			plotOptions: {
				series: {
					events: {
						click: function (e) {
							handleSeriesClick(e, unitGrouping)
						}
					},
					dataGrouping: {
						units: [[unitGrouping, null]],
						forced: true
					}
				}
			}
		});

	}, [props.payments, handleSeriesClick]);


	/*
	let toShow = false;
	if (chartOptions.series[0].data !== undefined) {
		toShow = true;
	}
	*/

	return (
		// className={toShow ? null : "hide"}
		<div className="mmrChart">
			<HighchartsReact
				highcharts={Highcharts}
				options={chartOptions}
				ref={chartRef}
			/>
		</div>
	);


}

/* ======================================= PieChart ======================================= */
export const PieChart = (props) => {

	const chartRef = useRef();
	const [chartOptions, setChartOptions] = useState({
		chart: {
			type: 'pie',
		},
		title: {
			text: ''
		},
		credits: {
			enabled: false
		},
		accessibility: {
			enabled: false
		},
		tooltip: {
			pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
		},
		plotOptions: {
			pie: {
				cursor: 'default',
				dataLabels: {
					enabled: true,
					format: '<b>{point.name}</b>: {point.percentage:.1f} %'
				}
			},
			series: {
				animation: {
					//defer: 2000
				}
			}
		}
	});

	const category = props.category;

	useEffect(() => {
		if (props.users.data) {
			const categories = new Set();
			const data = [];
			for (let i = 0; i < props.users.data.length; i++) {
				const item = props.users.data[i];

				if (!categories.has(item[category])) {
					categories.add(item[category]);
					data.push({
						name: item[category],
						y: 1
					});
				}
				else {
					for (let j = 0; j < data.length; j++) {
						if (data[j].name === item[category]) {
							data[j].y++;
							break;
						}
					}
				}
			}
			setChartOptions({
				series: [{
					data: data,
				}]
			});
		}
	}, [props.users, props.category]);

	return (
		<div className="pieChart">
			<HighchartsReact
				highcharts={Highcharts}
				options={chartOptions}
				ref={chartRef}
			/>
		</div>
	);

}