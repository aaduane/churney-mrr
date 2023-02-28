import { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import { readString } from "react-papaparse";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
import ChurneyLogo from "./churney.png";
import "./App.css";

//import { readCSV } from "./data.js"; // testing

// data
import usersCSV from "./data/users.csv";
import paymentsCSV from "./data/payments-sorted.csv";

// set global highcharts options
Highcharts.setOptions({
	lang: {
		thousandsSep: ","
	}
});

/* ======================================= App ======================================= */
export const App = () => {

	// setup state variables
	const [users, setUsers] = useState([]);
	const [payments, setPayments] = useState([]);
	const [dataLoaded, setDataLoaded] = useState(false)
	const [rangeFilter, setRangeFilter] = useState({ start: 0, end: 0 });
	const [filteredPayments, setFilteredPayments] = useState([]);
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [unitGrouping, setUnitGrouping] = useState("year");
	const [categories, setCategories] = useState([]);
	//const [categoryFilter, setCategoryFilter] = useState(null);

	// read CSV data into JSON object and set state
	useEffect(() => {

		//readCSV(); // testing

		// set document title
		document.title = "Churney Assignment";

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
				alert("Error while parsing CSV: ", error);
			}
		};

		//console.time("Read Users CSV"); // debugging
		readString(usersCSV, usersConfig);
		//console.timeEnd("Read Users CSV"); // debugging

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
				alert("Error while parsing CSV: ", error);
			}
		};

		// console.time("Read Payments CSV"); // debugging
		readString(paymentsCSV, paymentsConfig);
		// console.timeEnd("Read Payments CSV"); // debugging
	}, []);

	// copy data to filtered states for first load
	useEffect(() => {
		if (users.data !== undefined && payments.data !== undefined) {
			setFilteredPayments(payments);
			setFilteredUsers(users);
			setDataLoaded(true);
		}
	}, [users, payments]);

	// filter between start and end time for charts
	useEffect(() => {

		// FUTURE WORK: 
		// loop through all users and make a "Set" of those that have the "categoryFilter"
		// when filtering payments, check if uid is in Set before filtering
		// when filtering users, check if uid is in Set before filtering
		// console.log(categoryFilter);

		if (rangeFilter.start !== 0 && rangeFilter.end !== 0) {

			//console.log("START: " + new Date(rangeFilter.start).toUTCString()); // debugging
			//console.log("  END: " + new Date(rangeFilter.end).toUTCString()); // debugging

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

			// detect unit grouping
			const firstDate = new Date(filteredPayments.data[0].timestamp);
			const lastDate = new Date(filteredPayments.data[filteredPayments.data.length - 1].timestamp);
			const firstTimestampYear = firstDate.getUTCFullYear();
			const lastTimestampYear = lastDate.getUTCFullYear();
			const firstTimestampMonth = firstDate.getUTCMonth();
			const lastTimestampMonth = lastDate.getUTCMonth();
			if (firstTimestampYear === lastTimestampYear && firstTimestampMonth === lastTimestampMonth) {
				setUnitGrouping("day");
			}
			else if (firstTimestampYear === lastTimestampYear) {
				setUnitGrouping("month");
			}
			else {
				setUnitGrouping("year");
			}

			// set new states
			setFilteredUsers(filteredUsers);
			setFilteredPayments(filteredPayments); 
			setDataLoaded(true);
		}
	}, [rangeFilter, payments, users]);

	// handle drillup functionality
	const drillUp = () => {
		// force loading indicator render
		flushSync(() => {
			setDataLoaded(false);
		})

		// if in month view, just render all data again for years
		if (unitGrouping === "month") {	
			setFilteredUsers(users);
			setFilteredPayments(payments);
			setUnitGrouping("year");
		}

		// if in day view, need to filter out just the months of that year
		if (unitGrouping === "day") {
			const date = new Date(rangeFilter.start);
			const year = date.getUTCFullYear();

			if (year === 2023) {
				setFilteredUsers(users);
				setFilteredPayments(payments);
				setUnitGrouping("year");
			}
			else {
				const start = Date.UTC(year, 0, 1);
				const end = Date.UTC(year, 11, 31, 23, 59, 59);
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
				setUnitGrouping("month");	
			}			
		}

		// remove loading indicator again
		setDataLoaded(true);
	}

	// render DOM
	return (
		<div id="appWrapper">
			<div id="loading" className={dataLoaded ? "hide" : null}>
				<div id="loadingIndicator" style={{backgroundImage: `url(${ChurneyLogo})`}}></div>		
			</div>
			<div className={unitGrouping === "year" ? "hide" : null} id="drillUpBtnWrapper">
				<button onClick={() => drillUp()}>▲ back to {unitGrouping === "month" ? "years" : "months"}</button>
			</div>
			<div id="mmrWrapper">
				<MRRChart
					payments={filteredPayments}
					unitGrouping={unitGrouping}
					setRangeFilter={setRangeFilter}
					setDataLoaded={setDataLoaded}
				/>
			</div>
			<div id="pieChartsWrapper">
				{categories.map(category => (
					<PieChart
						key={category}
						users={filteredUsers}
						category={category}
						//setCategoryFilter={setCategoryFilter}
					/>
				))}
			</div>
		</div>
	)
}

/* ======================================= MRRChart ======================================= */
export const MRRChart = (props) => {
	// set up states
	const chartRef = useRef();
	const [chartOptions, setChartOptions] = useState({
		chart: {
			height: 500
		},
		title: {
			text: "Monthly Recurring Revenue",
		},
		subtitle: {
			text: "(click a data point to filter)"
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
			title: {
				text: "Dollars ($)"
			}
		}, { // Secondary yAxis
			title: {
				text: "Dollars ($)",
				style: {
					color: "#3498db",
				}
			},
			labels: {
				style: {
					color: "#3498db"
				}
			},
			opposite: true
		}],
		tooltip: {
			shared: true,
			valueDecimals: 0,
			valuePrefix: "$",
			//valuePrefix: "USD",
		},
		plotOptions: {
			series: {
				boostThreshold: 1,
				turboThreshold: 1,
				dataGrouping: {
					enabled: true,
					forced: true,
					units: [["year", null]]
				},
			}
		},
		legend: {
            itemStyle: {
            	//"cursor": "pointer"
            }
        },
	});

	// handle drilldown functionality
	const handleSeriesClick = useCallback((event) => {
		if (props.unitGrouping !== "day") {

			flushSync(() => {
				props.setDataLoaded(false);
			})

			const year = new Date(event.point.category).getUTCFullYear();
			const month = new Date(event.point.category).getUTCMonth();

			let start;
			let end;
			if (props.unitGrouping === "year") {
				start = Date.UTC(year, 0, 1);
				end = Date.UTC(year, 11, 31, 23, 59, 59);
			}

			if (props.unitGrouping === "month") {
				start = Date.UTC(year, month, 1);
				end = Date.UTC(year, month + 1, 0, 23, 59, 59);
			}

			props.setRangeFilter({ start: start, end: end });
		}
	}, [props]);

	// update line chart when payments or user data changes 
	useEffect(() => {

		// console.time("Parse Time:"); // debugging

		// organise data for highcharts api
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
		// console.timeEnd("Parse Time:"); // debugging

		// set series hover cursor for chart
		let cursor = "pointer"
		if (props.unitGrouping === "day") {
			cursor = "default"
		}

		// set state and update line chart
		setChartOptions({
			series: [{
				name: "Original",
				data: series,
				type: "column",
				color: "#00000",
				cursor: cursor
			},
			{
				name: "Churney",
				data: churney,
				type: "column",			
				color: "#9bfa91",
				cursor: cursor
			},
			{
				name: "Increase",
				data: difference,
				type: "spline",
				cursor: cursor,
				yAxis: 1,
				color: "#3498db",
				dataGrouping: {
					approximation: "sum"
				}
			}],
			plotOptions: {
				series: {
					events: {
						click: function (e) {
							handleSeriesClick(e, props.unitGrouping)
						}
					},
					dataGrouping: {
						units: [[props.unitGrouping, null]],
						forced: true
					}
				}
			}
		});

	}, [props.payments, props.unitGrouping, handleSeriesClick]);

	// render DOM
	return (
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
	// set up states
	const chartRef = useRef();
	const [chartOptions, setChartOptions] = useState({
		chart: {
			type: "pie",
		},
		title: {
			text: ""
		},
		credits: {
			enabled: false
		},
		accessibility: {
			enabled: false
		},
		tooltip: {
			pointFormat: "<b>{point.percentage:.1f}%<br />({point.y})</b>"
		},
		plotOptions: {
			pie: {
				cursor: "default",
				size: "55%",
				showInLegend: true,
				dataLabels: {
					enabled: true,
					format: "<b>{point.name}</b>: {point.percentage:.1f} %"
				}
			},
			series: {
				animation: {
					//defer: 2000
				}
			}
		}
	});

	/*
	const handleSeriesClick = useCallback((event) => {
		props.setCategoryFilter(event.point.name);
	}, [props]);
	*/

	// update pie charts when user data changes 
	useEffect(() => {

		// organise data for highcharts api
		const category = props.category;
		if (props.users.data) {
			const categories = new Set();
			const seriesData = [];
			for (let i = 0; i < props.users.data.length; i++) {
				const item = props.users.data[i];
				const categoryOption = item[category];
				if (!categories.has(categoryOption)) {
					categories.add(categoryOption);
					seriesData.push({
						name: categoryOption,
						y: 1
					});
				}
				else {
					for (let j = 0; j < seriesData.length; j++) {
						if (seriesData[j].name === categoryOption) {
							seriesData[j].y++;
							break;
						}
					}
				}
			}

			// fix product category order
			if (category === "product_category") {
				const sortAlphaNum = (a, b) => !!a.name ? a.name.localeCompare(b.name, "en", { numeric: true }) : true;
				seriesData.sort(sortAlphaNum);
			}

			// hide bad/error data and add custom colours
			const cleanSeriesData = [];
			const colors = {
				"country" : ["#b62020", "#fe5757"], // red
				"age_group" : ["#5C7A51", "#174207"], // green 
				"product_category" : ["#8e7cc3", "#71639c", "#554a75", "#38314e", "#1c1827"], // purple
				"subscription_frequency" : ["#e5c35b", "#b29747", "#7f6c33"] // yellow 
			}
			for (let i = 0; i < seriesData.length; i++) {
				const item = seriesData[i];	
				if (item.y > 1 && item.name !== "") {
					let index = cleanSeriesData.length;	
					cleanSeriesData.push({
						name: item.name,
						y: item.y,
						color: colors[category][index]
					});
				}
			}

			// format category for titles
			let capitalisedCategory = category.replace("_", " ").split(" ");
			for (let i = 0; i < capitalisedCategory.length; i++) {
				capitalisedCategory[i] = capitalisedCategory[i][0].toUpperCase() + capitalisedCategory[i].substr(1);
			}
			capitalisedCategory = capitalisedCategory.join(" ");			
			 
			// set state to update pie charts
			setChartOptions({
				title: {
					text: capitalisedCategory
				},
				series: [{
					data: cleanSeriesData,
					name: capitalisedCategory
				}],
				/*
				plotOptions: {
					series: {
						events: {
							click: function (e) {
								handleSeriesClick(e)
							}
						},
					}
				}
				*/
			});
		}
	}, [props.users, props.category]);

	// render DOM
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