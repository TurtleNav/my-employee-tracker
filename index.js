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

function MySQLQueryPromise(query, ...args) {
	return new Promise((resolve, reject) => {
		db.query(query, ...args, (err, result) => {
			if (err) {
				throw new Error(err);
			}
			resolve(result);
		});
	});
}

db.querySync = async function() {return await async function() {
	return await MySQLQueryPromise();
}}



async function getPromiseQuery(query, ...args) {
	let promise = new Promise((resolve, reject) => {
		db.query(query, ...args, (err, result) => {
			if (err) {
				throw new Error(err);
			}
			resolve(result);
		});
	});
	return await promise;
}


// A helper function for making synchronous queries i.e. whenever we need to
// manipulate the data from the query
db.querySync = async (query, ...args) => await getPromiseQuery(query, ...args)


/*
db.querySync = async function(query, ...args) {
	const data = await new Promise((resolve, reject) => {
		db.query(query, ...args, (err, result) => {
			if (err) {
				throw new Error(err);
			}
			resolve(result);
		});
	});
	return data;
}
*/


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
			"Update an employee role", "Quit"
		]
	}];
	return await inquirer.prompt(question);
}

function viewAllDepartments() {
	db.query('SELECT * FROM departments', (err, depts) => {
		depts ? tableDisplay(depts) : console.log('\nNone Found\n');
	});
}

function viewAllRoles() {
	db.query('SELECT * FROM roles', (err, roles) => {
		roles ? tableDisplay(roles) : console.log('\nNone Found\n');
	});	
}

function viewAllEmployees() {
	db.query('SELECT * FROM employees', (err, employees) => {
		roles ? tableDisplay(employees) : console.log('\nNone Found\n');
	});
}

async function addADepartment() {
	const question = [{
		message: "What is the name of the department?",
		name: "department",
		type: "prompt"
	}]
	const { department } = await inquirer.prompt(question);
	db.query("INSERT INTO departments SET name = ? WHERE NOT EXISTS", department, (err) => {
		if (!err) {
			console.log(`Added ${department} to the database`);
		}
	});
}

async function addARole() {

	const departments = await MySQLQueryPromise('SELECT * FROM departments');


	const questions = [
		{
			message: "What is the name of the role?",
			name: "title",
			type: "prompt",
			validate: (input) => (input.length <= 30)
		},
		{
			message: "What is the salary of the role?",
			name: "salary",
			type: "prompt",
			// Salary validator function:
			// must contain only numbers (containing 0,1,2,3,4,5,6,7,8,9)
			// Must be between 10,000 and 1,000,000
			validate: (input) => {
				const value = parseInt(input);
				return isNaN(value) ? false : ((value > 9999) && (value < 1000000));
			}
		},
		{
			message: "Which department does this role belong to?",
			name: "department",
			type: "list",
			choices: departments.map((department) => department.name)
		}
	]
	const { title, salary, department } = await inquirer.prompt(questions);

	const departmentID = (await MySQLQueryPromise('SELECT id FROM departments WHERE name = ?', department))[0].id;

	db.query("INSERT INTO roles SET title = ?, salary = ?, department_id = ?", [title, salary, departmentID], (err) => {
		if (!err) {
			console.log(`Added ${title} to the database`);
		} else {
			console.error(err);
		}
	});
}

async function run() {
	const { action } = await promptAction();
	switch (action) {
		case "View all departments":
			viewAllDepartments();
			break;
		case "View all roles":
			viewAllRoles();
			break;
		case "View all employees":
			viewAllEmployees();
			break;
		// The 'add a X' series of queries are themselves an inquirer prompt
		case "Add a department":
			await addADepartment()
			break;
		case "Add a role":
			await addARole();
			break;
		case "Quit":
			console.log("\x1b[2J\x1b");
			console.log("Goodbye!");
			return;
	}
	run();
}


const question1 = [{
	message: "What would you like to do?",
	name: "action",
	type: "list",
	choices: [
		"View all departments", "View all roles", "View all employees",
		"Add a department", "Add a role", "Add an employee",
		"Update an employee role", "Quit"
	]
}];

async function run2() {
	inquirer.prompt(question1).then(({action}) => {
		switch (action) {
			case "View all departments":
				viewAllDepartments();
				break;
			case "View all roles":
				viewAllRoles();
				break;
			case "View all employees":
				viewAllEmployees();
				break;
			case "Add a department":
				addADepartment()
				break;
			case "Quit":
				// use to break out but isn't an actual error
				const quitError = new Error();
				quitError.name = "quitError"
				throw quitError;
		}
	}).then((data) => {
		console.log(`data -> ${data}`);
		if (!data) {
			run2();
		}
	}).catch((err) => {
		// fake error used as a quit event
		if (err.name === "quitError") {
			console.log("Goodbye!");
			process.exit();
		}
		// genuine errors should be logged
		console.error(err)
	});
}

run2();

