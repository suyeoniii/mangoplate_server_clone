async function selectEatDeals(connection, area, page, limit) {
  var selectEatDealQuery = `select ED.idx eatDealIdx, imgUrl, title, subTitle, realPrice, salePrice,
  case
when TIMESTAMPDIFF(day, ED.createdAt, current_timestamp()) < 30
then 1
else 0
end as isNew,CONCAT(Round(100-salePrice/realPrice*100,0),'%') discount,
  packing isPacking
from EatDeal ED
left outer join (select idx, imgUrl, eatDealIdx from EatDealImg group by eatDealIdx) EI on EI.eatDealIdx = ED.idx
inner join (select Res.idx idx, area from Restaurant Res) Res on Res.idx=ED.restaurantIdx`;

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
async function selectEatDealById(connection) {
  const selectEatDealQuery = ``;

  const eatDealRows = await connection.query(selectEatDealQuery, []);
  return eatDealRows[0];
}
module.exports = {
  selectEatDeals,
  selectEatDealById,
};
