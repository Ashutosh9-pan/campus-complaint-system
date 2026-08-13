CREATE DATABASE IF NOT EXISTS campus_complaint_system;
USE campus_complaint_system;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    hostel VARCHAR(100),
    room_number VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    category ENUM(
        'Electrical',
        'Plumbing',
        'Internet',
        'Cleanliness',
        'Furniture',
        'Security',
        'Other'
    ) NOT NULL,
    location VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Urgent')
        NOT NULL DEFAULT 'Medium',
    status ENUM('Raised', 'In Progress', 'Resolved')
        NOT NULL DEFAULT 'Raised',
    admin_note TEXT,
    assigned_to INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,

    CONSTRAINT fk_complaint_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_complaint_admin
        FOREIGN KEY (assigned_to) REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE complaint_status_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    complaint_id INT NOT NULL,
    changed_by INT NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_complaint
        FOREIGN KEY (complaint_id) REFERENCES complaints(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_history_user
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_complaints_status
ON complaints(status);

CREATE INDEX idx_complaints_student
ON complaints(student_id);

CREATE INDEX idx_complaints_priority
ON complaints(priority);

-- Complaint assignment system
ALTER TABLE complaints
ADD COLUMN assigned_department VARCHAR(100) NULL AFTER status,
ADD COLUMN assigned_at TIMESTAMP NULL AFTER assigned_department;

CREATE INDEX idx_complaints_department
ON complaints (assigned_department);