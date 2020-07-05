create table Customer (
id int not null auto_increment,
customer_name varchar(100) not null,
customer_surname varchar(100) not null,
customer_age int not null,
customer_gender boolean not null,
primary key(id)
);

insert into customer set  customer_name="Jonas",
customer_surname="dark",customer_age=18,customer_gender=1