async function selectEatDeals(connection, area, page, limit) {
  var selectEatDealQuery = `select ED.idx eatDealIdx,imgUrl,CONCAT(CONCAT(CONCAT(CONCAT('[',area),']'),' '),restaurantName) restaurantName, menu,
  CONCAT('₩',FORMAT(realPrice,0)) realPrice,CONCAT('₩',FORMAT(salePrice,0)) salePrice,
  case
when TIMESTAMPDIFF(day, ED.updatedAt, current_timestamp()) < 30
then 1
else 0
end as                                      isNew,CONCAT(Round(100-salePrice/realPrice*100,0),'%') discount,
  packing                              isPacking
from EatDeal ED
left outer join (select idx, imgUrl, eatDealIdx from EatDealImg group by eatDealIdx) EI on EI.eatDealIdx = ED.idx
inner join (select Res.idx idx, area, restaurantName from Restaurant Res) Res on Res.idx=ED.restaurantIdx`;

  selectEatDealQuery += ` where 1`;

  //지역
  if (typeof area === "object") {
    selectEatDealQuery += ` AND (0`;
    for (var element in area) {
      selectEatDealQuery += ` OR area='${area[element]}'`;
    }
    selectEatDealQuery += `)`;
  } else if (typeof area === "string") {
    selectEatDealQuery += ` AND area='${area}'`;
  }

  if (!limit) {
    limit = 20;
  }
  if (!page) {
    page = 1;
  }
  if (page) {
    selectEatDealQuery += ` LIMIT ${limit * (page - 1)},${limit}`;
  }

  const eatDealRows = await connection.query(selectEatDealQuery, [
    area,
    page,
    limit,
  ]);
  return eatDealRows[0];
}
async function selectEatDealById(connection, eatDealIdx) {
  const selectEatDealQuery = `select ED.idx eatDealIdx,
  CONCAT(CONCAT(CONCAT(menu, ' '),CONCAT(Round(100-salePrice/realPrice*100,0),'%')),' 할인') comment,
  CONCAT(CONCAT(CONCAT(CONCAT('[',area),']'),' '),restaurantName) restaurantName,
  menu,CONCAT(days,'일') days,
  DATE_FORMAT(current_timestamp(), '%Y-%m-%d') startDate,
  DATE_FORMAT(DATE_ADD(current_timestamp(),INTERVAL 92 day),'%Y-%m-%d') endDate,
  CONCAT('₩',FORMAT(realPrice,0)) realPrice,CONCAT('₩',FORMAT(salePrice,0)) salePrice,
  CONCAT(Round(100-salePrice/realPrice*100,0),'%') discount,
  packing isPacking,contents
from EatDeal ED
inner join (select Res.idx idx, area, restaurantName from Restaurant Res) Res on Res.idx=ED.restaurantIdx
where ED.idx=?`;

  const selectEatDealImgQuery = `select EatDealImg.idx eatDealImgIdx,imgUrl from EatDealImg where eatDealIdx=?`;

  const [eatDealRows] = await connection.query(selectEatDealQuery, [
    eatDealIdx,
  ]);
  const [eatDealImgRows] = await connection.query(selectEatDealImgQuery, [
    eatDealIdx,
  ]);
  console.log(eatDealRows);
  eatDealRows[0].img = eatDealImgRows;
  return eatDealRows[0];
}
async function selectEatDealCheck(connection, eatDealIdx) {
  const selectEatDealQuery = `select ED.idx eatDealIdx,
  CONCAT(CONCAT(CONCAT(menu, ' '),CONCAT(Round(100-salePrice/realPrice*100,0),'%')),' 할인') comment,
  CONCAT(CONCAT(CONCAT(CONCAT('[',area),']'),' '),restaurantName) restaurantName,
  menu,CONCAT(days,'일') days,
  DATE_FORMAT(current_timestamp(), '%Y-%m-%d') startDate,
  DATE_FORMAT(DATE_ADD(current_timestamp(),INTERVAL 92 day),'%Y-%m-%d') endDate,
  realPrice,salePrice,
  CONCAT(Round(100-salePrice/realPrice*100,0),'%') discount,
  packing isPacking,contents
from EatDeal ED
inner join (select Res.idx idx, area, restaurantName from Restaurant Res) Res on Res.idx=ED.restaurantIdx
where ED.idx=?`;

  const selectEatDealImgQuery = `select EatDealImg.idx eatDealImgIdx,imgUrl from EatDealImg where eatDealIdx=?`;

  const [eatDealRows] = await connection.query(selectEatDealQuery, [
    eatDealIdx,
  ]);
  const [eatDealImgRows] = await connection.query(selectEatDealImgQuery, [
    eatDealIdx,
  ]);
  console.log(eatDealRows);
  eatDealRows[0].img = eatDealImgRows;
  return eatDealRows[0];
}
async function insertOrder(
  connection,
  orderNo,
  userIdFromJWT,
  eatDealIdx,
  tid
) {
  const insertOrderQuery = `INSERT INTO OrderInfo(orderNo,userIdx,eatDealIdx,tid) VALUE(?,?,?,?)`;

  const [eatDealRows] = await connection.query(insertOrderQuery, [
    orderNo,
    userIdFromJWT,
    eatDealIdx,
    tid,
  ]);

  return [eatDealRows];
}
async function selectOrderCheck(connection, orderNo) {
  const selectOrderQuery = `select tid, orderNo, userIdx,status from OrderInfo Where orderNo=?`;

  const [eatDealRows] = await connection.query(selectOrderQuery, [orderNo]);

  return eatDealRows[0];
}
async function updateOrderStatus(connection, orderNo, status) {
  const updateOrderStatusQuery = `UPDATE OrderInfo SET status=? where orderNo=?`;

  const [eatDealRows] = await connection.query(updateOrderStatusQuery, [
    status,
    orderNo,
  ]);

  return eatDealRows;
}
async function selectOrderNo(connection, orderNo) {
  const selectOrderQuery = `select orderNo from OrderInfo Where orderNo=?;`;

  const [eatDealRows] = await connection.query(selectOrderQuery, [orderNo]);

  return eatDealRows[0];
}
module.exports = {
  selectEatDeals,
  selectEatDealById,
  selectEatDealCheck,
  insertOrder,
  selectOrderCheck,
  updateOrderStatus,
  selectOrderNo,
};
