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

const questions = {
	// The very first question to prompt the user with. Subsequent prompts
	// will use `subsequentPrompt` which is more-or-less this question 
	// with a different prompt
	firstPrompt: () => {
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
			return inquirer.prompt(question);
	},

	subsequentPrompt: () => {
		const question = [{
			message: "Is there anything else you would you like to do?",
			name: "action",
			type: "list",
			choices: [
				"View all departments", "View all roles", "View all employees",
				"Add a department", "Add a role", "Add an employee",
				"Update an employee role", "Quit"
			]
			}];
			return inquirer.prompt(question);
	},
}

const actions = {
	viewAllDepartments: () => {
		db.query('SELECT * FROM departments', (err, depts) => {
			if (err) throw err;
			depts ? tableDisplay(depts) : console.log('\nNone Found\n');
		});
	},

	viewAllRoles: () => {
		db.query('SELECT * FROM roles', (err, roles) => {
			if (err) throw err;
			roles ? tableDisplay(roles) : console.log('\nNone Found\n');
		});	
	},
	
	viewAllEmployees: () => {
		console.log('heloooooo')
		db.query('SELECT * FROM employees', (err, employees) => {
			if (err) throw err;
			employees.length ? tableDisplay(employees) : console.log('\nNone Found\n');
		});
	},

	addADepartment: async () => {
		const question = [{
			message: "What is the name of the department?",
			name: "department",
			type: "prompt"
		}]
		inquirer.prompt(question).then(({department}) => {
			db.query("INSERT INTO departments SET name = ? WHERE NOT EXISTS", department, (err) => {
				if (!err) {
					console.log(`Added ${department} to the database`);
				}
			});	
		});
	}
}

// main entry point
async function run(prompt) {
	prompt().then(({action}) => {
		switch (action) {
			case "View all departments":
				actions.viewAllDepartments();
				break;
			case "View all roles":
				actions.viewAllRoles();
				break;
			case "View all employees":
				actions.viewAllEmployees();
				break;
			case "Add a department":
				actions.addADepartment().then((data) => console.log(data));
				break;
			case "Add a role":
				actions.addARole();
				break;
			case "Quit":
				// use to break out but isn't an actual error
				const quitError = new Error();
				quitError.name = "quitError"
				throw quitError;
		}
	}).then((data) => {
		if (!data) {
			run(questions.subsequentPrompt);
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

run(questions.firstPrompt);