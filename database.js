const mysql = require("mysql2");

const db = mysql.createConnection({

    host: "localhost",

    user: "root",

    password: "Enimwa_@2026",

    database: "student_management"

});


db.connect((error) => {

    if (error) {

        console.log("MySQL connection failed:", error.message);

        return;

    }

    console.log("MySQL Connected Successfully!");

});


module.exports = db;