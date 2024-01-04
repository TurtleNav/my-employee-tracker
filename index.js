
const inquirer = require("inquirer");

const questions = [];

async function promptAction() {
	const question = [{
		message: "What would you like to do?",
		name: "action",
		type: "list",
		choices: [
			"View all departments", "View all roles", "View all employees",
			"Add a department", "Add a role", "Add an employee", "Update an employee role"
		]
	}];
	return await inquirer.prompt(question);
}


promptAction();

