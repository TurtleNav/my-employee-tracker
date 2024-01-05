const inquirer = require("inquirer");
const mysql = require('mysql2');

const db = mysql.createConnection(
	{
	  host: 'localhost',
	  user: 'root',
	  password: 'password123ABC!',
	  database: 'business_db',
	},
	console.log(`Connected to the business_db database.`)
);

function prettyDisplay(column_names=[], columns=[]) {

	if (column_names.length !== columns.length) {
		throw Error('The number of column names must equal the number of columns');
	}

	console.log(columns);
	// Create an array containing the length of each individual column in the columns array,
	// then check if each column is the same length (or else we raise an error)
	const nEntries = columns[0].length;
	if (!columns.map((column) => column.length).every((column_length => column_length === nEntries))) {
		throw Error("The length of each column in the columns array should be equal");
	}
	
	function getStringLength(object) {
		return typeof(object) === "string" ? object.length : object.toString().length;
	}

	// An array containing the max length of entries in each column
	const maxLengths = columns.forEach((column, index) => {
		return Math.max(getStringLength(column_names[index], ...column.map((e) => getStringLength(e))));
	});

	console.log(`\n${column_names.join(' ')}`);
	console.log(maxLengths.map((n) => '-'.repeat(n)).join(' '));

	let i = 0;
	do {
		console.log(columns.map((column) => column[i]).join(' '));
	} while (i++ <= nEntries);
}

function getStringLength(object) {
	if (object === null) {
		return 4;
	}
	switch (typeof(object)) {
		case "boolean":
			return object ? 4 : 5;
		case "undefined":
			return 9;
		case "string":
			return object.length;
		default:
			return object.toString().length;
	}
}

function tableDisplay(resultsArray) {
	if (!resultsArray.length) {
		return;
	}
	//const firstEntry = resultsArray[0];
	//const columnNames = Object.keys(firstEntry);

	// Create an array of the max length for each column. Initalized with zero
	//const maxLengths = new Array(columnNames.length).fill(0);



	let columnNames
	const maxLengths = new Map();
	for (const result of resultsArray) {
		if (!columnNames) {
			columnNames = Object.keys(result);
			for (const columnName of columnNames) {
				maxLengths.set(columnName, getStringLength(columnName));
			}
		}
		for (const [columnName, columnEntry] of Object.entries(result)) {
			maxLengths.set(columnName, Math.max(maxLengths.get(columnName), getStringLength(columnEntry)));
		}
	}
	/*
	columnNames.forEach((name, index) => {
		maxLengths[index]
	});
	*/

	//const maxLengths = new Map(columnNames.map((name) => [name, getStringLength(name)]));

	/*
	const maxLengths = columns.forEach((column, index) => {
		return Math.max(getStringLength(columnNames[index], ...column.map((e) => getStringLength(e))));
	});
	*/
	console.log(`\n${columnNames.join(' ')}`);
	//console.log(maxLengths.values().map((n) => '-'.repeat(n)).join(' '));
	//maxLengths.forEach((name, n) => console.log('-'.repeat(n)));
	//console.log(maxLengths.map((n) => '-'.repeat(n)).join(' '));
}


async function promptAction() {
	const question = [{
		message: "What would you like to do?",
		name: "action",
		type: "list",
		choices: [
			"View all departments", "View all roles", "View all employees",
			"Add a department", "Add a role", "Add an employee",
			"Update an employee role"
		]
	}];
	return await inquirer.prompt(question);
}

function viewAllDepartments() {
	db.query('SELECT * FROM departments', (err, depts) => {
		tableDisplay(depts);
		// console.table(depts, ['id', 'name']);
		//console.log('\nid name\n-- -----------');
		//depts.forEach((dept) => console.log(`${dept.id}  ${dept.name}`));
	});
}

async function run() {
	const { action } = await promptAction();
	
	if (action === "View all departments") {
		viewAllDepartments();
	}
}

run();

