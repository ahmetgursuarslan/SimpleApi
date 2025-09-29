CREATE TABLE IF NOT EXISTS customer (
	id INT NOT NULL AUTO_INCREMENT,
	customer_name VARCHAR(100) NOT NULL,
	customer_surname VARCHAR(100) NOT NULL,
	customer_age INT NOT NULL,
	customer_gender ENUM('male','female','other') NOT NULL,
	PRIMARY KEY (id)
);

INSERT INTO customer (customer_name, customer_surname, customer_age, customer_gender)
VALUES ("Jonas", "Dark", 18, 'male');