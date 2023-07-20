//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");

const app = express();
app.set("views", "views");
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "../public"));
app.use(cors());

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
});

const itemsSchema = mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to todoList",
});

const item2 = new Item({
  name: "Hit the + button to add new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

// Item.insertMany(defaultItems);

app.get("/", function (req, res) {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length == 0) {
        Item.insertMany(defaultItems);
      }

      res.render("list.ejs", { listTitle: "Today", newListItems: foundItems });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  // console.log(customListName);

  List.findOne({ name: customListName })
    .then((foundItems) => {
      if (foundItems) {
        // console.log("List found");
        res.render("list.ejs", {
          listTitle: foundItems.name,
          newListItems: foundItems.items,
        });
      } else {
        // console.log("List not found");
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        res.redirect("/" + customListName);
      }
    })
    .catch((error) => {
      console.error("Error finding items:", error);
    });

  // console.log(req.params.customListName);
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((error) => {
        console.error("Error finding user:", error);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({ _id: checkedItemId })
      .then((result) => {
        // console.log(result);
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then((updatedUser) => {
        res.redirect("/" + listName);
      })
      .catch((error) => {
        console.error("Error updating user:", error);
      });
  }
});

app.get("/work", function (req, res) {
  res.render("list.ejs", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about.ejs");
});
if (process.env.API_PORT) {
  app.listen(process.env.API_PORT, function () {
    console.log("Server started on port 3000");
  });
}
module.exports = app;
