const express = require('express');
const apiRouter = express.Router();
const employeesRouter = require('./employees.js');
const menuRouter = require('./menu.js');

apiRouter.use('/menus',menuRouter);
apiRouter.use('/employees',employeesRouter);

module.exports = apiRouter;
