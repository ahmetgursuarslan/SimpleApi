module.exports = (app) => {
  const customers = require('../controllers/customer.controller.js');

  /**
   * @openapi
   * /api/customers:
   *   get:
   *     summary: List customers
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *       - in: query
   *         name: gender
   *         schema: { type: string, enum: [male, female, other] }
   *       - in: query
   *         name: minAge
   *         schema: { type: integer }
   *       - in: query
   *         name: maxAge
   *         schema: { type: integer }
   *       - in: query
   *         name: fields
   *         schema: { type: string, description: "Comma-separated: id,name,surname,age,gender" }
   *       - in: query
   *         name: sortBy
   *         schema: { type: string, enum: [id, name, surname, age, gender] }
   *       - in: query
   *         name: order
   *         schema: { type: string, enum: [asc, desc] }
   *       - in: query
   *         name: advancedFilter
   *         schema: { type: string, description: "JSON: e.g. {\"age.gte\": 18, \"gender.eq\": \"female\"}" }
   *         example: '{"age.gte":18,"age.lte":30,"name.in":["Ali","Veli"]}'
   *     responses:
   *       200:
   *         description: A paginated list of customers
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items: { type: object }
   *                 page: { type: integer }
   *                 pageSize: { type: integer }
   *                 total: { type: integer }
   *                 totalPages: { type: integer }
   *                 returnedFieldsCount: { type: integer }
   *             examples:
   *               basic:
   *                 summary: Basic listing with pagination
   *                 value:
   *                   data:
   *                     - { id: 1, customer_name: 'Ali', customer_surname: 'Veli', customer_age: 30, customer_gender: 'male' }
   *                   page: 1
   *                   pageSize: 50
   *                   total: 123
   *                   totalPages: 3
   *                   returnedFieldsCount: 5
   *               filtered:
   *                 summary: Filtered and selected fields
   *                 value:
   *                   data:
   *                     - { id: 2, customer_name: 'Ayşe', customer_age: 25 }
   *                   page: 1
   *                   pageSize: 10
   *                   total: 2
   *                   totalPages: 1
   *                   returnedFieldsCount: 3
   *               range:
   *                 summary: Age between 20 and 30 (advancedFilter age.gt/lte)
   *                 value:
   *                   data:
   *                     - { id: 3, customer_name: 'Mehmet', customer_surname: 'Demir', customer_age: 28, customer_gender: 'male' }
   *                   page: 1
   *                   pageSize: 20
   *                   total: 8
   *                   totalPages: 1
   *                   returnedFieldsCount: 5
   *               searchAndIn:
   *                 summary: Search + surname.in with selected fields
   *                 value:
   *                   data:
   *                     - { id: 5, customer_name: 'Ali', customer_age: 22 }
   *                   page: 1
   *                   pageSize: 20
   *                   total: 1
   *                   totalPages: 1
   *                   returnedFieldsCount: 3
   */
  app.get('/api/customers', customers.validators.list, customers.findAll);

  /**
   * @openapi
   * /api/customers:
   *   post:
   *     summary: Create a customer
   *     tags: [Customers]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CustomerCreate'
   *           examples:
   *             sample:
   *               value:
   *                 customer_name: Ali
   *                 customer_surname: Veli
   *                 customer_age: 30
   *                 customer_gender: male
   *     responses:
   *       201:
   *         description: Created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Customer'
   */
  app.post('/api/customers', customers.validators.create, customers.create);

  /**
   * @openapi
   * /api/customers/{customerId}:
   *   get:
   *     summary: Get a customer by ID
   *     tags: [Customers]
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Customer
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Customer'
   */
  app.get('/api/customers/:customerId', customers.validators.findOne, customers.findOne);

  /**
   * @openapi
   * /api/customers/{customerId}:
   *   put:
   *     summary: Update a customer by ID
   *     tags: [Customers]
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CustomerCreate'
   *           examples:
   *             sample:
   *               value:
   *                 customer_name: AliUpdated
   *                 customer_surname: VeliUpdated
   *                 customer_age: 31
   *                 customer_gender: male
   *     responses:
   *       200:
   *         description: Updated customer
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Customer'
   */
  app.put('/api/customers/:customerId', customers.validators.update, customers.update);

  /**
   * @openapi
   * /api/customers/{customerId}:
   *   delete:
   *     summary: Delete a customer by ID
   *     tags: [Customers]
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Delete result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message: { type: string }
   */
  app.delete('/api/customers/:customerId', customers.validators.delete, customers.delete);

  /**
   * @openapi
   * /api/customers:
   *   delete:
   *     summary: Delete all customers
   */
  app.delete('/api/customers', customers.deleteAll);

  /**
   * @openapi
   * /api/customers/stats/gender:
   *   get:
   *     summary: Customer counts by gender
   */
  app.get('/api/customers/stats/gender', customers.statsByGender);

  /**
   * @openapi
   * /api/customers/stats/age:
   *   get:
   *     summary: Customer counts by age bins
   */
  app.get('/api/customers/stats/age', customers.statsByAge);
};
