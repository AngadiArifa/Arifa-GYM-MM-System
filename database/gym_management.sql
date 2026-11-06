CREATE DATABASE IF NOT EXISTS gym_management;
USE gym_management;

CREATE TABLE IF NOT EXISTS members (
  member_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(15) NOT NULL,
  join_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS membership_plans (
  plan_id INT AUTO_INCREMENT PRIMARY KEY,
  plan_name VARCHAR(100) NOT NULL,
  duration_months INT NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  plan_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  CONSTRAINT fk_subscription_member FOREIGN KEY (member_id)
    REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id)
    REFERENCES membership_plans(plan_id) ON DELETE RESTRICT
);

-- Extra tables support the trainer-assignment feature mentioned in the project description.
CREATE TABLE IF NOT EXISTS trainers (
  trainer_id INT AUTO_INCREMENT PRIMARY KEY,
  trainer_name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100),
  phone VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS trainer_assignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  trainer_id INT NOT NULL,
  assigned_date DATE NOT NULL,
  CONSTRAINT fk_assignment_member FOREIGN KEY (member_id)
    REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_trainer FOREIGN KEY (trainer_id)
    REFERENCES trainers(trainer_id) ON DELETE CASCADE
);

-- Optional sample data (run once; remove these INSERTs if you want an empty database)
INSERT IGNORE INTO members (member_id, name, email, phone, join_date, status) VALUES
(1, 'Aarav Sharma', 'aarav@example.com', '9876500001', '2026-01-10', 'Active'),
(2, 'Meera Reddy', 'meera@example.com', '9876500002', '2026-02-05', 'Active');

INSERT IGNORE INTO membership_plans (plan_id, plan_name, duration_months, fee, description) VALUES
(1, 'Monthly', 1, 1500.00, 'Access to gym facilities for one month'),
(2, 'Quarterly', 3, 4000.00, 'Access to gym facilities for three months'),
(3, 'Annual', 12, 12000.00, 'Full-year gym membership');

INSERT IGNORE INTO subscriptions (subscription_id, member_id, plan_id, start_date, end_date, payment_status) VALUES
(1, 1, 1, '2026-01-10', '2026-02-10', 'Paid'),
(2, 2, 2, '2026-02-05', '2026-05-05', 'Pending');

INSERT IGNORE INTO trainers (trainer_id, trainer_name, specialty, phone) VALUES
(1, 'Rahul Verma', 'Strength Training', '9876500011'),
(2, 'Sana Khan', 'Yoga and Fitness', '9876500012');

INSERT IGNORE INTO trainer_assignments (assignment_id, member_id, trainer_id, assigned_date) VALUES
(1, 1, 1, '2026-01-10'),
(2, 2, 2, '2026-02-05');
