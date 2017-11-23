const express = require('express');
const menuRouter = express.Router();
const menuItemRouter = require('./menuitems.js');
const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

menuRouter.param('menuId',(req,res,next,menuId)=>{
  //obtains the current menu being used and puts it to req.menu
  db.get('SELECT * FROM Menu WHERE id = $id',{$id:menuId},(err,results) =>{
    if(err){
      next(err);
    } else if(results){
      req.menu = results;
      next();
    } else {
      res.sendStatus(404);
    }
  })
})

menuRouter.use('/:menuId/menu-items',menuItemRouter);

menuRouter.get('/',(req,res,next) =>{
  //gets all menus
  db.all('SELECT * FROM Menu',(err,results) =>{
    if(err){
      next(err);
    } else {
      res.status(200).json({menus:results});
    }
  })
})

menuRouter.post('/',(req,res,next) => {
  //creates new menu
  const title = req.body.menu.title;
  if(!title){
    res.sendStatus(400);
  }

  db.run('INSERT INTO Menu (title) VALUES ($title)',{$title:title},(err)=>{
    if(err){
      next(err);
    } else {
      db.get('SELECT * FROM Menu WHERE id = last_insert_rowid()',(err,results)=>{
        if(err){
          next(err);
        } else {
        res.status(201).json({menu:results});
      }
      })
    }
  })
});

menuRouter.get('/:menuId',(req,res,next) =>{
  //gets menu at certain ID
  res.status(200).json({menu:req.menu});
})

menuRouter.put('/:menuId',(req,res,next) =>{
  //updates menu at ID
  const title = req.body.menu.title;
  if(!title){
    res.sendStatus(400);
  }

  db.run('UPDATE Menu SET title = $title WHERE id = $id',{$title:title,$id:req.menu.id},(err) =>{
    if(err){
      next(err);
    } else{
      db.get('SELECT * FROM Menu WHERE id = $id',{$id:req.menu.id},(err,result)=>{
        res.status(200).json({menu:result});
      })
    }
  })
})

menuRouter.delete('/:menuId',(req,res,next) =>{
  //deletes menu with ID if not associated with any foreign keys at the time
  db.get('SELECT * FROM MenuItem WHERE MenuItem.menu_id = $id',{$id:req.menu.id},(err,result) =>{
    if(err){
      next(err);
    } else if(result){
      res.sendStatus(400);
    }else if(!result) {
      db.run('DELETE FROM Menu WHERE NOT EXISTS (SELECT * FROM MenuItem WHERE menu_id = $id)',{$id:req.menu.id},(err)=>{
        res.sendStatus(204);
    })
  }
})
});
module.exports = menuRouter;
