CREATE TABLE IF NOT EXISTS customer (
	id INT NOT NULL AUTO_INCREMENT,
	customer_name VARCHAR(100) NOT NULL,
	customer_surname VARCHAR(100) NOT NULL,
	customer_age INT NOT NULL,
	customer_gender ENUM('male','female','other') NOT NULL,
	PRIMARY KEY (id),
	-- Columns used by the list endpoint's filters and ORDER BY; without these
	-- every filtered page is a full table scan.
	KEY idx_customer_gender (customer_gender),
	KEY idx_customer_age (customer_age),
	KEY idx_customer_name (customer_name),
	KEY idx_customer_surname (customer_surname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO customer (customer_name, customer_surname, customer_age, customer_gender)
VALUES ('Jonas', 'Dark', 18, 'male');
