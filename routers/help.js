const express = require ("express");
const router = express.Router();
const connection = require("../utils/db");
const { checkLogin } = require("../middlewares/auth");
const path = require("path");
const moment = require("moment");

//行事曆
router.get("/helpcalendar/:year/:month", async (req, res) => {
    let [data, fields] = await connection.execute
// 抓出有案件的日期：行事曆中該年月下的日期
    ("SELECT day(date) AS day FROM case_give WHERE year(date) = ? AND month(date)= ?",
[req.params.year,req.params.month]);
    res.json(data);
});

//該日案件列表（連動行事曆）
router.get("/dayhelps/:year/:month/:day", async (req, res) => {
  let [data, fields] = await connection.execute(
// 抓出該日的所有案件及細節 再JOIN case_take抓應徵人數
// 再JOIN 抓出tag名稱
    `SELECT give.*, COUNT (case_take.user_id_taker) AS taker_count, day(date), month(date), year(date), case_tag.name AS tag_name
    FROM case_give AS give
    LEFT JOIN case_take ON give.id = case_take.case_id
    JOIN case_tag ON give.tag_id = case_tag.id
    WHERE give.status=0 AND year(date) = ? AND month(date)= ? AND day(date)= ?
    GROUP BY give.id
    ORDER BY give.region DESC`,[req.params.year, req.params.month, req.params.day]);
  res.json(data);
});




//互助專區
router.get("/helpcard/:region", async (req, res) => {
  let [data, fields] = await connection.execute(
//抓出該地區的所有案件及細節 再JOIN users抓使用者頭像
    `SELECT case_give.*, users.image AS user_image, case_tag.name AS tag_name FROM case_give 
    JOIN users ON case_give.user_id_giver = users.id
    JOIN case_tag ON case_give.tag_id = case_tag.id
    WHERE status=0 AND region = ?
    ORDER BY case_give.date ASC`, [req.params.region]);
  res.json(data);
});

//發案表單
router.post("/helppost", async (req, res) => {
  let [data, fields] = await connection.execute(
//寫入發案者填寫的案件資訊
    `INSERT INTO case_give (user_id_giver, category_id, tags, date, region, price, title, content, created_at, status, image) VALUES
    ('[${req.params.id}', '${req.params.categoty}', '${req.params.tag}', '${req.params.date}', '${req.params.region}', '${req.params.price}', '${req.params.title}', '${req.params.content}', '${GETDATE()}}','0', '${req.params.image}')`);
  res.json(data);
});

//案件細節頁（案件列表或互助專區點開）
router.get("/helpdetails/:id", async (req, res) => {
  let [data, fields] = await connection.execute(
//抓出該案件的所有細節 再JOIN users抓使用者頭像及暱稱
    `SELECT case_give.*, users.image AS user_image, users.name AS user_name, case_tag.name AS tag_name
    FROM case_give 
    JOIN users ON case_give.user_id_giver = users.id
    JOIN case_tag ON case_give.tag_id = case_tag.id
    WHERE case_give.status=0 AND case_give.id = ?`, [req.params.id]);
  res.json(data);
});

//案件細節頁：接案者應徵表單
router.post("/helpdetails", async (req, res) => {
  let [data, fields] = await connection.execute(
//寫入應徵者填寫資訊
    `INSERT INTO case_take (user_id_taker, contact, content, status) VALUES
    ('[${req.params.id}', '${req.params.contact}', '${req.params.content}', '0')`);
  res.json(data);
});

//案件細節頁：發案者編輯案件內容
router.put("/helpdetails", async (req, res) => {
  let [data, fields] = await connection.execute(
//修改案件內容
    `UPDATE case_give SET title=?, date=?, price=?, region=?, content=?, category=?, tags=?, img=? WHERE id = ${req.params.id}`, [req.params.title,req.params.date, req.params.price, req.params.region, req.params.content, req.params.category, req.params.tags, req.params.img]);
  res.json(data);
});



// MEMBER 歷史紀錄：該會員的發案紀錄
router.get("/memberGiveHistory/:user_id_giver", async (req, res) => {
  let [data, fields] = await connection.execute(
// http://localhost:3002/api/help/memberGiveHistory/
// 抓出該日的所有案件及細節 再JOIN case_take抓應徵人數
// 再JOIN 抓出tag名稱
    `SELECT give.*, COUNT(case_take.user_id_taker) AS taker_count, DAY(DATE), MONTH(DATE), YEAR(DATE), case_tag.name AS tag_name, users.id AS userid FROM case_give AS give JOIN case_take ON give.id = case_take.case_id JOIN case_tag ON give.tag_id = case_tag.id JOIN users ON give.user_id_giver =users.id WHERE user_id_giver = ? GROUP BY give.id ORDER BY give.region DESC;`,[req.params.user_id_giver]);
  res.json(data);
});

  module.exports = router;