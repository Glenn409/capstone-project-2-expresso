const express = require('express');
const timeSheetRouter = express.Router({mergeParams: true});

const sqlite = require('sqlite3')
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

timeSheetRouter.param('timesheetId',(req,res,next,timesheetId) =>{
  //gets the current timesheet being used and puts it to req.timesheet
  db.get('SELECT * FROM Timesheet WHERE id = $id',
        {
          $id: timesheetId
        },(err,result) =>{
          if(err){
            next(err);
          } else if(result){
            req.timesheet = result;
            next();
          } else {
            res.sendStatus(404);
          }
        })
});

timeSheetRouter.get('/',(req,res,next) => {
  //gets all timesheets for the current employee
  db.all('SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employee_id',
        {
          $employee_id: req.employee.id
        },(err,timesheets) => {
          if (err){
            next(err);
          } else {
            res.status(200).json({timesheets: timesheets});
          }
        })
});

timeSheetRouter.post('/',(req,res,next) => {
  //creates a new timesheet
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date;
  if(!hours || !rate || !date || !req.employee.id){
    return res.sendStatus(400);
  }

  db.run('INSERT INTO Timesheet (hours,rate,date,employee_id) VALUES ($hours,$rate,$date,$employee_id)',
        {
          $hours: hours,
          $rate: rate,
          $date: date,
          $employee_id: req.employee.id
        },(err)=>{
          if(err){
            throw(err);
          } else {
            db.get('SELECT * FROM Timesheet WHERE id = last_insert_rowid()',
          (err,result) =>{
            res.status(201).json({timesheet:result});
          })
          }
        })
});

timeSheetRouter.put('/:timesheetId',(req,res,next) =>{
//  console.log(req.body.timesheet)
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date;

    if (!hours || !rate || !date){
      return res.sendStatus(400);
    }
    db.run('UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE id = $timesheetId',
      {
        $hours: hours,
        $rate: rate,
        $date: date,
        $timesheetId: req.timesheet.id
      },(err) =>{
        if(err){
          next(err);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE id = ${req.timesheet.id}`,
            (err,timesheet) => {
                res.status(200).json({timesheet:timesheet});
                });
        }
      });
});

timeSheetRouter.delete('/:timesheetId',(req,res,next) =>{
  //deletes a timesheet at timesheet ID
  db.run('DELETE FROM Timesheet WHERE id = $id',{$id: req.timesheet.id},(err)=>{
    if(err){
      next(err);
    } else {
      res.sendStatus(204);
    }
  })
});
module.exports = timeSheetRouter;
