INSERT INTO departments (name)
VALUES ("Engineering"),
       ("Finance"),
       ("Legal"),
       ("Sales");

INSERT INTO roles (title, department, salary)
VALUES ("Sales Lead", 4, 100000);
VALUES ("Salesperson", 4, 80000);
VALUES ("Lead Engineer", 1, 150000);
VALUES ("Software Engineer", 1, 120000);
VALUES ("Account Manager", 2, 160000);
VALUES ("Accountant", 2, 125000);
VALUES ("Legal Team Lead", 3, 250000);
VALUES ("Lawyer", 3, 190000);

INSERT INTO employees (first_name, last_name, role_id, manager_id)
VALUES ("John", "Doe", 1, NULL);
VALUES ("Mike", "Chan", 2, 1);
VALUES ("Ashely", "Rodriguez", 3, NULL);
VALUES ("Kevin", "Tupik", 4, 3);
VALUES ("Kunal", "Singh", 5, NULL);
VALUES ("Malia", "Brown", 6, 5);
VALUES ("Sarah", "Lourd", 7, NULL);
VALUES ("Tom", "Allen", 8, 7);
