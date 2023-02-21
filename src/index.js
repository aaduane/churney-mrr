import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

import Highcharts from "highcharts/highstock";
require("highcharts/modules/data")(Highcharts)
require("highcharts/modules/boost")(Highcharts)

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<App />
);

/* forces console clear on hot reload during development */
window.addEventListener("message", e => {
	if (process.env.NODE_ENV !== "production" && e.data && e.data.type === "webpackInvalid") {
		console.clear();
	}
});
