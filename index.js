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

// A helper function for making synchronous queries i.e. whenever we need to
// manipulate the data from the query
db.querySync = async (query, ...args) => await getPromiseQuery(query, ...args)

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
		db.query('SELECT * FROM employees', (err, employees) => {
			if (err) throw err;
			employees.length ? tableDisplay(employees) : console.log('\nNone Found\n');
		});
	},

	addADepartment: (department) => {
		console.log(`department -> ${department}`)
		db.query("INSERT INTO departments SET name = ?", department, (err) => {
				if (!err) {
					console.log(`\nAdded ${department} to the database\n`);
				} else {
					console.error(err);
				}
			});	
	},

	addARole: (title, salary, departmentID) => {
		db.query("INSERT INTO roles SET title = ?, salary = ?, department_id = ?", [title, salary, departmentID], (err) => {
		if (!err) {
			console.log(`Added ${title} to the database`);
		} else {
			console.error(err);
		}
		});
	},

	// separately handle if manager argument is provided or not
	addAEmployee: (firstName, lastName, roleID, managerID) => {
		if (managerID) {
			db.query("INSERT INTO employees SET first_name = ?, last_name = ?, role_id = ?, manager_id = ?",
			[firstName, lastName, roleID, managerID], (err) => {
				if (err) {
					console.log(`Added ${firstName} ${lastName} to the database`);
				} else {
					console.error(err)
				}
			});
		} else {
			db.query("INSERT INTO employees SET first_name = ?, last_name = ?, role_id = ?",
			[firstName, lastName, roleID, managerID], (err) => {
				if (err) {
					console.log(`Added ${firstName} ${lastName} to the database`);
				} else {
					console.error(err)
				}
			});
		}
	}
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

	addADepartmentPrompt: () => {
		const question = [{
			message: "What is the name of the department?",
			name: "department",
			type: "prompt"
		}]
		return inquirer.prompt(question).then(({department}) => {
			actions.addADepartment(department);
		});
	},

	addARolePrompt: async () => {
		// Need somehow a means of extracting the global list of departments
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
		return inquirer.prompt(questions).then(async({title, salary, department}) => {
			const departmentID = (await MySQLQueryPromise('SELECT id FROM departments WHERE name = ?', department))[0].id;
			actions.addARole(title, salary, departmentID);
		});
	},

	addEmployeePrompt: async () => {
		// need roles managers(employees) to formulate our questions
		const roles = await MySQLQueryPromise('SELECT * FROM departments')

		const questions = [{
			type: "input",
			message: "What is the employee's first name?",
			name: "firstName"
		},
		{
			type: "input",
			message: "what is the employee's last name?",
			name: "lastName"
		},
		{
			type: "list",
			message: "What is the employee's role?",
			name: "role",
			choices: roles
		}
		// assume by default there are no available managers. Only once we
		// get employee data is a manager question added here
	]
	const managerData = await MySQLQueryPromise('SELECT * FROM employees');
	// Handle the situation where there are no employees to be manager
		if (managerData.length) {
			managers = managerData.map((employee) => `${employee.first_name} ${employee.last_name}`);
			questions.push({
				type: "list",
				message: "who is the employee's manager?",
				name: "manager",
				choices: managers
			});
		}

	return inquirer.prompt(questions).then(async({firstName, lastName, role, manager}) => {
		const roleID = (await MySQLQueryPromise('SELECT id FROM departments WHERE name = ?', role))[0].id;
		if (manager) {
			// only set manager if one exists
			const managerID = (await MySQLQueryPromise('SELECT id FROM employees WHERE first_name = ? AND last_name = ?', manager.split(' ')))[0].id;
			actions.addAEmployee(firstName, lastName, roleID, managerID);
		} else {
			actions.addAEmployee(firstName, lastName, roleID);
		}
	})
	},

	updateEmployeeRole: async () => {
		// cheaty way of updating an employee's role is by re-passing add employee prompt
		await addEmployeePrompt();
	}
}

// main entry point
async function run(prompt) {
	const {action} = await prompt();
	console.log('\r')
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
			// question handles more nested prompts
			await questions.addADepartmentPrompt();
			break;
		case "Add a role":
			await questions.addARolePrompt();
			break;
		case "Add an employee":
			await questions.addEmployeePrompt();
			break;
		case "Update an employee role":
			await questions.updateEmployeeRole();
		case "Quit":
			// use to break out
			console.log("Goodbye!");
			process.exit();
		}
		console.log('\r\n');
		run(questions.subsequentPrompt);
}

run(questions.firstPrompt);