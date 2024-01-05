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

// helper function for getting the string length for just about any object
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

// Please god don't make me write this again
// This is my take on displaying tabular data (i.e. in a similar fashion to MySQL)
function tableDisplay(resultsArray) {
	if (!resultsArray.length) {
		return;
	}
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
	console.log(columnNames.map((name) => `${name}${' '.repeat(maxLengths.get(name) - name.length + 1)}`).join(''));
	console.log(columnNames.map((name) => '-'.repeat(maxLengths.get(name))).join(' '));
	for (const result of resultsArray) {
		console.log(Object.entries(result).map(([k, v]) => `${v}${' '.repeat(maxLengths.get(k) - getStringLength(v) + 1)}`).join(''));
	}
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
		depts ? tableDisplay(depts) : console.log('\nNone Found\n');
	});
}

async function run() {
	const { action } = await promptAction();
	
	if (action === "View all departments") {
		viewAllDepartments();
	}
}

run();

