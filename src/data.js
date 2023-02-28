import { readString } from "react-papaparse";

// cav files
import usersCSV from "./data/users.csv";
import paymentsCSV from "./data/payments-sorted.csv";

const files = [usersCSV, paymentsCSV]

const configCSV = {
	download: true,
	complete: results => {
		console.log(results);
		return results;
	},
	error: (error) => {
		alert("Error while parsing CSV: ", error);
	}
};

export const readCSV = async () => {

	Promise.all(
		files
			.map(
				file => 
				new Promise(
					(resolve, reject) =>
						readString(file, configCSV)
				)
			)
	)
	.then(
		function (results) {
			console.log(results[0])
			console.log(results[1])
		}
	)
	.catch(//log the error
		err => console.warn("Something went wrong: ", err)
	)

}

