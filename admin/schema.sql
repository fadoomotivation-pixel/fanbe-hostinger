-- Fanbe Real Estate CRM - Database Schema
-- Run this after the initial users/sessions/activity_log tables are created

-- Projects / Properties
CREATE TABLE IF NOT EXISTS projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  location VARCHAR(255),
  type ENUM('Residential', 'Commercial', 'Plot') DEFAULT 'Residential',
  status ENUM('Active', 'Sold Out', 'Upcoming') DEFAULT 'Active',
  total_units INT DEFAULT 0,
  available_units INT DEFAULT 0,
  price_range VARCHAR(100),
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  source ENUM('Website', 'Walk-in', 'Reference', 'Call', 'Social Media', 'MagicBricks', 'Google Ads') DEFAULT 'Website',
  project_interest INT,
  status ENUM('New', 'Hot', 'Warm', 'Cold', 'Converted', 'Lost') DEFAULT 'New',
  assigned_to INT,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_interest) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Follow-ups
CREATE TABLE IF NOT EXISTS followups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  employee_id INT NOT NULL,
  followup_date DATE NOT NULL,
  followup_time TIME,
  type ENUM('Call', 'WhatsApp', 'Email', 'Meeting') DEFAULT 'Call',
  notes TEXT,
  status ENUM('Pending', 'Completed', 'Missed') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Site Visits
CREATE TABLE IF NOT EXISTS site_visits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  project_id INT,
  visit_date DATE NOT NULL,
  visit_time TIME,
  employee_id INT NOT NULL,
  status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings / Sales
CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  project_id INT,
  unit_number VARCHAR(50),
  amount DECIMAL(12,2) DEFAULT 0.00,
  booking_date DATE NOT NULL,
  payment_status ENUM('Token', 'Partial', 'Full') DEFAULT 'Token',
  employee_id INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample projects
INSERT INTO projects (name, location, type, status, total_units, available_units, price_range) VALUES
('Fanbe Heights', 'Sector 45, Gurgaon', 'Residential', 'Active', 120, 45, '85L - 1.5Cr'),
('Fanbe Business Park', 'Cyber City, Gurgaon', 'Commercial', 'Active', 80, 30, '1.2Cr - 3.5Cr'),
('Fanbe Green Valley', 'Sohna Road, Gurgaon', 'Plot', 'Upcoming', 200, 200, '25L - 60L'),
('Fanbe Royal Residences', 'Golf Course Road, Gurgaon', 'Residential', 'Active', 60, 12, '2Cr - 4.5Cr'),
('Fanbe Metro Square', 'NH-8, Gurgaon', 'Commercial', 'Sold Out', 50, 0, '90L - 2Cr');
