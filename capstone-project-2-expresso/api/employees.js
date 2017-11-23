const express = require('express');
const employeesRouter = express.Router();
const timeSheetRouter = require('./timesheets.js');

const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite')

employeesRouter.param('employeeId',(req,res,next,employeeId) => {
  //obtains the appropiate employee when an employeeId is required for further use
    db.get('SELECT * FROM Employee WHERE Employee.id = $id',
    {
      $id: employeeId
    },(err,result) => {
      if(err){
        next(err);
      } else if (result){
        req.employee = result;
        next();
      } else {
        res.sendStatus(404);
      }
    });
});
employeesRouter.use('/:employeeId/timesheets',timeSheetRouter);

employeesRouter.get('/',(req,res,next) => {
  //returns all employees
  db.all('SELECT * FROM Employee WHERE is_current_employee = 1',(err,results) =>{
    if(err){
      next(err);
    } else {
      res.status(200).json({employees:results});
    }
  });
});

employeesRouter.post('/',(req,res,next) =>{
  //obtains the requests properties and checks if they are vailid
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage;
  if( (!name) || (!position) || (!wage)){
      res.sendStatus(400);
    }
  //creates a new employee then returns the employee
    db.run('INSERT INTO Employee (name,position,wage) VALUES ($name,$position,$wage)',
      {
        $name: name,
        $position: position,
        $wage: wage,
      },(err,result) =>{
        if(err){
          next(err);
        } else {
          db.get(`SELECT * FROM Employee WHERE Employee.id = last_insert_rowid()`,
            (error, results) => {
              res.status(201).json({employee:results});
            });
        }
      })
});

employeesRouter.get('/:employeeId',(req,res,next) =>{
    //returns a single employee
    res.status(200).json({employee:req.employee});
});

employeesRouter.put('/:employeeId',(req,res,next) => {
  //updates the employee selected with employeeId with req.body variables
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage;
  if( (!name) || (!position) || (!wage)){
      res.sendStatus(400);
    }

    db.run('UPDATE Employee SET name = $name, position = $position, wage = $wage',
          {
            $name: name,
            $position: position,
            $wage: wage
          },(err) => {
            if (err){
              next(err);
            } else {
              db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.employee.id}`,
              (err,results) =>{
                res.status(200).json({employee:results});
              })
            }
          })
});

employeesRouter.delete('/:employeeId',(req,res,next) =>{
  //sets the employee to unemployee to 0 indicating not employed
  db.run(`UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = ${req.employee.id}`,(err) =>{
    if(err){
      next(err);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.employee.id}`,
      (err,results) =>{
        if(err){
          next(err);
        } else if(results){
        res.status(200).send({employee:results});
        }
      })
    }
  })
});

module.exports = employeesRouter;
