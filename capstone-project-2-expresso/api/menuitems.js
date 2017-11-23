const express = require('express');
const menuItemRouter = express.Router({mergeParams: true});

const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemRouter.param('menuItemId',(req,res,next,menuItemId) =>{
  //gets the current menuItem ID and puts it to the req.menuItem
    db.get('SELECT * FROM MenuItem WHERE id = $id',{$id:menuItemId},(err,result)=>{
      if(err){
        next(err)
      }else if (result){
        req.menuItem = result;
        next();
      } else {
        res.sendStatus(404);
      }
    })
});

menuItemRouter.get('/',(req,res,next) => {
  //receives all MenuItems from a Menu
  db.all('SELECT * FROM MenuItem WHERE menu_id = $menu_id',{$menu_id:req.menu.id},(err,result)=>{
    if(err){
      next(err);
    } else {
      res.status(200).send({menuItems:result});
    }
  })
});

menuItemRouter.post('/',(req,res,next) =>{
  // creates a new menuItem at menuID
  const name = req.body.menuItem.name,
        description = req.body.menuItem.description,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price;
  if(!name || !description || !inventory || !price) {
    return res.sendStatus(400);
  }
  db.run('INSERT INTO MenuItem (name,description,inventory,price,menu_id) VALUES ($name,$description,$inventory,$price,$menu_id)',
        {
          $name: name,
          $description: description,
          $inventory: inventory,
          $price: price,
          $menu_id: req.menu.id
        },(err) =>{
          if(err){
            next(err);
          } else {
            db.get('SELECT * FROM MenuItem WHERE id = last_insert_rowid()',(err,result)=>{
              res.status(201).json({menuItem:result});
            })
          }
        })
})

menuItemRouter.put('/:menuItemId',(req,res,next) =>{
  //updates the current menuItem by ID
  const name = req.body.menuItem.name,
        description = req.body.menuItem.description,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price;
  if(!name || !description || !inventory || !price) {
    return res.sendStatus(400);
  }

  db.run('UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menu_id WHERE id =$id',
        {
          $name: name,
          $description: description,
          $inventory: inventory,
          $price: price,
          $menu_id: req.menu.id,
          $id: req.menuItem.id
        },(err) =>{
          if(err){
            next(err);
          } else {
            db.get('SELECT * FROM MenuItem WHERE id = $id',{$id:req.menuItem.id},(err,result)=>{
              res.status(200).json({menuItem:result});
            })
          }
        })
});

menuItemRouter.delete('/:menuItemId',(req,res,next) =>{
  //deletes the menuItem at ID
  db.run('DELETE FROM MenuItem WHERE id = $id',{$id:req.menuItem.id},(err) => {
    if(err){
      next(err);
    } else {
      res.sendStatus(204);
    }
  })
})
module.exports = menuItemRouter;
