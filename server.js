const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./database");

const app = express();


// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());
app.use(express.static("public"));


// ========================================
// REGISTER STUDENT
// ========================================

app.post("/api/register", async (req, res) => {

    const {
        fullName,
        email,
        phone,
        password
    } = req.body;

    try {

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users
            (full_name, email, phone, password_hash, role)
            VALUES (?, ?, ?, ?, 'student')
        `;

        db.query(
            sql,
            [
                fullName,
                email,
                phone,
                hashedPassword
            ],
            (error, result) => {

                if (error) {

                    console.log(
                        "DATABASE ERROR:",
                        error.message
                    );

                    if (
                        error.code ===
                        "ER_DUP_ENTRY"
                    ) {

                        return res.status(409).json({

                            success: false,

                            message:
                                "Email already registered."

                        });

                    }

                    return res.status(500).json({

                        success: false,

                        message:
                            "Registration failed."

                    });

                }

                console.log(
                    "Registration successful. ID:",
                    result.insertId
                );

                res.json({

                    success: true,

                    message:
                        "Registration successful!"

                });

            }
        );

    } catch (error) {

        console.log(
            "REGISTRATION ERROR:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Registration failed."

        });

    }

});


// ========================================
// LOGIN
// ========================================

app.post("/api/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    const sql = `
        SELECT *
        FROM users
        WHERE email = ?
    `;

    db.query(
        sql,
        [email],
        async (error, results) => {

            if (error) {

                console.log(
                    "LOGIN DATABASE ERROR:",
                    error.message
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Login failed."

                });

            }

            if (results.length === 0) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."

                });

            }

            const user =
                results[0];

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );

            if (!passwordMatch) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."

                });

            }

            console.log(
                "LOGIN SUCCESS:",
                user.email
            );

            res.json({

                success: true,

                message:
                    "Login successful!",

                user: {

                    id:
                        user.id,

                    fullName:
                        user.full_name,

                    email:
                        user.email,

                    phone:
                        user.phone,

                    role:
                        user.role

                }

            });

        }
    );

});


// ========================================
// STUDENT PROFILE
// ========================================

app.get(
    "/api/student/profile/:id",
    (req, res) => {

        const studentId =
            req.params.id;

        const sql = `
            SELECT
                id,
                full_name,
                email,
                phone,
                role,
                created_at
            FROM users
            WHERE id = ?
            AND role = 'student'
        `;

        db.query(
            sql,
            [studentId],
            (error, results) => {

                if (error) {

                    console.log(
                        "PROFILE DATABASE ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to load profile."

                    });

                }

                if (results.length === 0) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Student not found."

                    });

                }

                const student =
                    results[0];

                res.json({

                    success: true,

                    student: {

                        id:
                            student.id,

                        fullName:
                            student.full_name,

                        email:
                            student.email,

                        phone:
                            student.phone,

                        role:
                            student.role,

                        createdAt:
                            student.created_at

                    }

                });

            }
        );

    }
);


// ========================================
// GET ALL SUBJECTS
// ========================================

app.get(
    "/api/subjects",
    (req, res) => {

        const sql = `
            SELECT
                id,
                subject_code,
                subject_name,
                description
            FROM subjects
            ORDER BY subject_code
        `;

        db.query(
            sql,
            (error, results) => {

                if (error) {

                    console.log(
                        "SUBJECTS DATABASE ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to load subjects."

                    });

                }

                res.json({

                    success: true,

                    subjects:
                        results

                });

            }
        );

    }
);


// ========================================
// REGISTER SUBJECT FOR STUDENT
// ========================================

app.post(
    "/api/student/subjects",
    (req, res) => {

        const {
            studentId,
            subjectId
        } = req.body;

        if (
            !studentId ||
            !subjectId
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID and Subject ID are required."

            });

        }

        const checkStudentSql = `
            SELECT id
            FROM users
            WHERE id = ?
            AND role = 'student'
        `;

        db.query(
            checkStudentSql,
            [studentId],
            (studentError, studentResults) => {

                if (studentError) {

                    console.log(
                        "STUDENT CHECK ERROR:",
                        studentError.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to verify student."

                    });

                }

                if (
                    studentResults.length === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Student not found."

                    });

                }

                const checkSubjectSql = `
                    SELECT id
                    FROM subjects
                    WHERE id = ?
                `;

                db.query(
                    checkSubjectSql,
                    [subjectId],
                    (subjectError, subjectResults) => {

                        if (subjectError) {

                            console.log(
                                "SUBJECT CHECK ERROR:",
                                subjectError.message
                            );

                            return res.status(500).json({

                                success: false,

                                message:
                                    "Failed to verify subject."

                            });

                        }

                        if (
                            subjectResults.length === 0
                        ) {

                            return res.status(404).json({

                                success: false,

                                message:
                                    "Subject not found."

                            });

                        }

                        const sql = `
                            INSERT INTO student_subjects
                            (student_id, subject_id)
                            VALUES (?, ?)
                        `;

                        db.query(
                            sql,
                            [
                                studentId,
                                subjectId
                            ],
                            (error, result) => {

                                if (error) {

                                    console.log(
                                        "SUBJECT REGISTRATION ERROR:",
                                        error.message
                                    );

                                    if (
                                        error.code ===
                                        "ER_DUP_ENTRY"
                                    ) {

                                        return res.status(409).json({

                                            success: false,

                                            message:
                                                "You have already registered this subject."

                                        });

                                    }

                                    return res.status(500).json({

                                        success: false,

                                        message:
                                            "Subject registration failed."

                                    });

                                }

                                res.json({

                                    success: true,

                                    message:
                                        "Subject registered successfully!",

                                    registrationId:
                                        result.insertId

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);


// ========================================
// GET STUDENT REGISTERED SUBJECTS
// ========================================

app.get(
    "/api/student/subjects/:studentId",
    (req, res) => {

        const studentId =
            req.params.studentId;

        const sql = `
            SELECT
                student_subjects.id,
                subjects.id AS subject_id,
                subjects.subject_code,
                subjects.subject_name,
                subjects.description,
                student_subjects.registered_at

            FROM student_subjects

            INNER JOIN subjects
                ON student_subjects.subject_id =
                   subjects.id

            WHERE student_subjects.student_id = ?

            ORDER BY subjects.subject_code
        `;

        db.query(
            sql,
            [studentId],
            (error, results) => {

                if (error) {

                    console.log(
                        "MY SUBJECTS DATABASE ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to load registered subjects."

                    });

                }

                res.json({

                    success: true,

                    subjects:
                        results

                });

            }
        );

    }
);


// ========================================
// REMOVE STUDENT SUBJECT
// ========================================

app.delete(
    "/api/student/subjects/:studentId/:subjectId",
    (req, res) => {

        const studentId =
            req.params.studentId;

        const subjectId =
            req.params.subjectId;

        const sql = `
            DELETE FROM student_subjects
            WHERE student_id = ?
            AND subject_id = ?
        `;

        db.query(
            sql,
            [
                studentId,
                subjectId
            ],
            (error, result) => {

                if (error) {

                    console.log(
                        "REMOVE SUBJECT ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to remove subject."

                    });

                }

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Registered subject not found."

                    });

                }

                res.json({

                    success: true,

                    message:
                        "Subject removed successfully."

                });

            }
        );

    }
);


// ========================================
// GET STUDENT RESULTS
// ========================================

app.get(
    "/api/student/results/:studentId",
    (req, res) => {

        const studentId =
            req.params.studentId;

        const sql = `
            SELECT
                results.id,
                subjects.subject_code,
                subjects.subject_name,
                results.marks,
                results.grade,
                results.semester,
                results.academic_year,
                results.created_at

            FROM results

            INNER JOIN subjects
                ON results.subject_id =
                   subjects.id

            WHERE results.student_id = ?

            ORDER BY
                results.academic_year DESC,
                results.semester DESC,
                subjects.subject_code
        `;

        db.query(
            sql,
            [studentId],
            (error, results) => {

                if (error) {

                    console.log(
                        "RESULTS DATABASE ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to load results."

                    });

                }

                res.json({

                    success: true,

                    results:
                        results

                });

            }
        );

    }
);


// ========================================
// ADD STUDENT RESULT
// ========================================

app.post(
    "/api/results",
    (req, res) => {

        const {
            studentId,
            subjectId,
            marks,
            semester,
            academicYear
        } = req.body;

        if (
            !studentId ||
            !subjectId ||
            marks === undefined ||
            !semester ||
            !academicYear
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All result information is required."

            });

        }

        const numericMarks =
            Number(marks);

        if (
            numericMarks < 0 ||
            numericMarks > 100
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Marks must be between 0 and 100."

            });

        }

        let grade;

        if (numericMarks >= 70) {

            grade = "A";

        } else if (numericMarks >= 60) {

            grade = "B";

        } else if (numericMarks >= 50) {

            grade = "C";

        } else if (numericMarks >= 40) {

            grade = "D";

        } else {

            grade = "F";

        }

        const sql = `
            INSERT INTO results
            (
                student_id,
                subject_id,
                marks,
                grade,
                semester,
                academic_year
            )

            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                studentId,
                subjectId,
                numericMarks,
                grade,
                semester,
                academicYear
            ],
            (error, result) => {

                if (error) {

                    console.log(
                        "ADD RESULT ERROR:",
                        error.message
                    );

                    if (
                        error.code ===
                        "ER_DUP_ENTRY"
                    ) {

                        return res.status(409).json({

                            success: false,

                            message:
                                "Result already exists for this student, subject and semester."

                        });

                    }

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to add result."

                    });

                }

                res.json({

                    success: true,

                    message:
                        "Result added successfully!",

                    resultId:
                        result.insertId,

                    grade:
                        grade

                });

            }
        );

    }
);


// ========================================
// GET ALL RESULTS - ADMIN
// ========================================

app.get(
    "/api/results",
    (req, res) => {

        const sql = `
            SELECT
                results.id,
                users.id AS student_id,
                users.full_name,
                users.email,
                subjects.subject_code,
                subjects.subject_name,
                results.marks,
                results.grade,
                results.semester,
                results.academic_year,
                results.created_at

            FROM results

            INNER JOIN users
                ON results.student_id =
                   users.id

            INNER JOIN subjects
                ON results.subject_id =
                   subjects.id

            ORDER BY results.created_at DESC
        `;

        db.query(
            sql,
            (error, results) => {

                if (error) {

                    console.log(
                        "ALL RESULTS ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to load results."

                    });

                }

                res.json({

                    success: true,

                    results:
                        results

                });

            }
        );

    }
);


// ========================================
// GET STUDENT FEES
// ========================================

app.get(
    "/api/student/fees/:studentId",
    (req, res) => {

        const studentId =
            req.params.studentId;

        const sql = `
            SELECT
                id,
                fee_type,
                amount,
                amount_paid,
                academic_year,
                created_at
            FROM fees
            WHERE student_id = ?
            ORDER BY created_at DESC
        `;

        db.query(
            sql,
            [studentId],
            (error, results) => {

                if (error) {

                    console.log(
                        "FEES ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to load fees."

                    });

                }

                res.json({

                    success: true,

                    fees:
                        results

                });

            }
        );

    }
);


// ========================================
// GET STUDENT HOSTEL
// ========================================

app.get(
    "/api/student/hostel/:studentId",
    (req, res) => {

        const studentId =
            req.params.studentId;

        const sql = `
            SELECT
                id,
                hostel_name,
                block_name,
                room_number,
                bed_number,
                status,
                created_at
            FROM hostel_allocations
            WHERE student_id = ?
        `;

        db.query(
            sql,
            [studentId],
            (error, results) => {

                if (error) {

                    console.log(
                        "HOSTEL ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to load hostel information."

                    });

                }

                res.json({

                    success: true,

                    hostel:
                        results.length > 0
                            ? results[0]
                            : null

                });

            }
        );

    }
);


// ========================================
// GET STUDENT DOCUMENTS
// ========================================

app.get(
    "/api/student/documents/:studentId",
    (req, res) => {

        const studentId =
            req.params.studentId;

        const sql = `
            SELECT
                id,
                document_name,
                document_url,
                created_at
            FROM documents
            WHERE student_id = ?
            ORDER BY created_at DESC
        `;

        db.query(
            sql,
            [studentId],
            (error, results) => {

                if (error) {

                    console.log(
                        "DOCUMENTS ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to load documents."

                    });

                }

                res.json({

                    success: true,

                    documents:
                        results

                });

            }
        );

    }
);


// ========================================
// UPDATE STUDENT PROFILE
// ========================================

app.put(
    "/api/student/profile/:studentId",
    (req, res) => {

        const studentId =
            req.params.studentId;

        const {
            fullName,
            email,
            phone
        } = req.body;

        if (
            !fullName ||
            !email ||
            !phone
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All profile information is required."

            });

        }

        const sql = `
            UPDATE users
            SET
                full_name = ?,
                email = ?,
                phone = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [
                fullName,
                email,
                phone,
                studentId
            ],
            (error) => {

                if (error) {

                    console.log(
                        "PROFILE UPDATE ERROR:",
                        error.message
                    );

                    if (
                        error.code ===
                        "ER_DUP_ENTRY"
                    ) {

                        return res.status(409).json({

                            success: false,

                            message:
                                "Email already exists."

                        });

                    }

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to update profile."

                    });

                }

                res.json({

                    success: true,

                    message:
                        "Profile updated successfully!"

                });

            }
        );

    }
);


// ========================================
// CHANGE STUDENT PASSWORD
// ========================================

app.put(
    "/api/student/password/:studentId",
    async (req, res) => {

        const studentId =
            req.params.studentId;

        const {
            currentPassword,
            newPassword
        } = req.body;


        if (
            !currentPassword ||
            !newPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Both passwords are required."

            });

        }


        if (
            newPassword.length < 6
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be at least 6 characters."

            });

        }


        const sql = `
            SELECT password_hash
            FROM users
            WHERE id = ?
            AND role = 'student'
        `;


        db.query(
            sql,
            [studentId],
            async (error, results) => {


                if (error) {

                    console.log(
                        "PASSWORD DATABASE ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Database error."

                    });

                }


                if (
                    results.length === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Student not found."

                    });

                }


                const validPassword =
                    await bcrypt.compare(
                        currentPassword,
                        results[0].password_hash
                    );


                if (!validPassword) {

                    return res.status(401).json({

                        success: false,

                        message:
                            "Current password is incorrect."

                    });

                }


                const newHash =
                    await bcrypt.hash(
                        newPassword,
                        10
                    );


                const updateSql = `
                    UPDATE users
                    SET password_hash = ?
                    WHERE id = ?
                    AND role = 'student'
                `;


                db.query(
                    updateSql,
                    [
                        newHash,
                        studentId
                    ],
                    (updateError) => {


                        if (updateError) {

                            console.log(
                                "PASSWORD UPDATE ERROR:",
                                updateError.message
                            );

                            return res.status(500).json({

                                success: false,

                                message:
                                    "Failed to change password."

                            });

                        }


                        res.json({

                            success: true,

                            message:
                                "Password changed successfully!"

                        });

                    }
                );

            }
        );

    }
);


// ========================================
// ADMIN - GET ALL STUDENTS
// ========================================

app.get(
    "/api/admin/students",
    (req, res) => {

        const sql = `
            SELECT
                id,
                full_name,
                email,
                phone,
                created_at
            FROM users
            WHERE role = 'student'
            ORDER BY id DESC
        `;

        db.query(
            sql,
            (error, results) => {

                if (error) {

                    console.log(
                        "ADMIN STUDENTS ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to load students."

                    });

                }

                res.json({

                    success: true,

                    students:
                        results

                });

            }
        );

    }
);


// ========================================
// ADMIN - GET ONE STUDENT
// ========================================

app.get(
    "/api/admin/students/:id",
    (req, res) => {

        const studentId =
            req.params.id;

        const sql = `
            SELECT
                id,
                full_name,
                email,
                phone,
                created_at
            FROM users
            WHERE id = ?
            AND role = 'student'
        `;

        db.query(
            sql,
            [studentId],
            (error, results) => {

                if (error) {

                    console.log(
                        "ADMIN STUDENT ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to load student."

                    });

                }

                if (
                    results.length === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Student not found."

                    });

                }

                res.json({

                    success: true,

                    student:
                        results[0]

                });

            }
        );

    }
);


// ========================================
// ADMIN - UPDATE STUDENT
// ========================================

app.put(
    "/api/admin/students/:id",
    (req, res) => {

        const studentId =
            req.params.id;

        const {
            fullName,
            email,
            phone
        } = req.body;

        if (
            !fullName ||
            !email ||
            !phone
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All student information is required."

            });

        }

        const sql = `
            UPDATE users
            SET
                full_name = ?,
                email = ?,
                phone = ?
            WHERE id = ?
            AND role = 'student'
        `;

        db.query(
            sql,
            [
                fullName,
                email,
                phone,
                studentId
            ],
            (error) => {

                if (error) {

                    console.log(
                        "ADMIN UPDATE STUDENT ERROR:",
                        error.message
                    );

                    if (
                        error.code ===
                        "ER_DUP_ENTRY"
                    ) {

                        return res.status(409).json({

                            success: false,

                            message:
                                "Email already exists."

                        });

                    }

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to update student."

                    });

                }

                res.json({

                    success: true,

                    message:
                        "Student updated successfully!"

                });

            }
        );

    }
);


// ========================================
// ADMIN - DELETE STUDENT
// ========================================

app.delete(
    "/api/admin/students/:id",
    (req, res) => {

        const studentId =
            req.params.id;

        const sql = `
            DELETE FROM users
            WHERE id = ?
            AND role = 'student'
        `;

        db.query(
            sql,
            [studentId],
            (error, result) => {

                if (error) {

                    console.log(
                        "ADMIN DELETE STUDENT ERROR:",
                        error.message
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to delete student."

                    });

                }

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Student not found."

                    });

                }

                res.json({

                    success: true,

                    message:
                        "Student deleted successfully!"

                });

            }
        );

    }
);


// ========================================
// START SERVER
// ========================================

// Local: port 3000
// Online: hosting platform's PORT

const PORT =
    process.env.PORT || 3000;

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "=============================="
        );

        console.log(
            "SERVER STARTED"
        );

        console.log(
            `PORT: ${PORT}`
        );

        console.log(
            "=============================="
        );

        console.log("");

    }
);