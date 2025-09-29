const Customer = require('../models/customer.model.js');
const { celebrate, Joi, Segments } = require('celebrate');

// Validation schemas
const customerBodySchema = {
  [Segments.BODY]: Joi.object({
    customer_name: Joi.string().min(1).max(100).required(),
    customer_surname: Joi.string().min(1).max(100).required(),
    customer_age: Joi.number().integer().min(0).max(130).required(),
    customer_gender: Joi.string().valid('male', 'female', 'other').required(),
  }),
};

const idParamSchema = {
  [Segments.PARAMS]: Joi.object({
    customerId: Joi.number().integer().positive().required(),
  }),
};

const listQuerySchema = {
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(50),
    search: Joi.string().max(100).optional(),
    sortBy: Joi.string().valid('id', 'name', 'surname', 'age', 'gender').default('id'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    // Filters
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    minAge: Joi.number().integer().min(0).optional(),
    maxAge: Joi.number().integer().min(0).max(130).optional(),
    // Select fields (comma-separated of whitelist keys)
    fields: Joi.string().max(200).optional(),
    // Advanced filter as JSON string. Will be parsed and validated server-side
    advancedFilter: Joi.string().max(2000).optional(),
  }),
};

exports.validators = {
  create: celebrate(customerBodySchema),
  update: celebrate({ ...customerBodySchema, ...idParamSchema }),
  findOne: celebrate(idParamSchema),
  delete: celebrate(idParamSchema),
  list: celebrate(listQuerySchema),
};

// Create and Save a new Customer
exports.create = (req, res, next) => {
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: 'Content can not be empty!',
    });
  }

  // Create a Customer
  const customer = new Customer({
    customer_name: req.body.customer_name,
    customer_surname: req.body.customer_surname,
    customer_age: req.body.customer_age,
    customer_gender: req.body.customer_gender,
  });

  // Save Customer in the database
  Customer.create(customer, (err, data) => {
    if (err) return next(err);
    return res.status(201).send(data);
  });
};

exports.findAll = (req, res, next) => {
  const { page, pageSize, search, sortBy, order, gender, minAge, maxAge, fields, advancedFilter } =
    req.query;
  Customer.getAll(
    { page, pageSize, search, sortBy, order, gender, minAge, maxAge, fields, advancedFilter },
    (err, data) => {
      if (err) return next(err);
      return res.send(data);
    }
  );
};

exports.findOne = (req, res) => {
  Customer.findById(req.params.customerId, (err, data) => {
    if (err) {
      if (err.kind === 'not_found') {
        res.status(404).send({
          message: `Not found Customer with id ${req.params.customerId}.`,
        });
      } else {
        res.status(500).send({ message: 'Error retrieving Customer' });
      }
    } else res.send(data);
  });
};

exports.update = (req, res, next) => {
  // Validate Request
  if (!req.body) {
    res.status(400).send({
      message: 'Content can not be empty!',
    });
  }

  Customer.updateById(req.params.customerId, new Customer(req.body), (err, data) => {
    if (err) {
      if (err.kind === 'not_found') {
        res.status(404).send({
          message: `Not found Customer with id ${req.params.customerId}.`,
        });
      } else {
        return next(err);
      }
    } else res.send(data);
  });
};

exports.delete = (req, res) => {
  Customer.remove(req.params.customerId, (err, data) => {
    if (err) {
      if (err.kind === 'not_found') {
        res.status(404).send({
          message: `Not found Customer with id ${req.params.customerId}.`,
        });
      } else {
        res.status(500).send({ message: 'Could not delete Customer' });
      }
    } else res.send({ message: `Customer was deleted successfully!` });
  });
};

exports.deleteAll = (req, res, next) => {
  Customer.removeAll((err, data) => {
    if (err) return next(err);
    return res.send({ message: `All Customers were deleted successfully!` });
  });
};

// Analytics
exports.statsByGender = (req, res, next) => {
  Customer.statsByGender((err, data) => {
    if (err) return next(err);
    return res.send({ data });
  });
};

exports.statsByAge = (req, res, next) => {
  Customer.statsByAgeBins((err, data) => {
    if (err) return next(err);
    return res.send({ data });
  });
};
