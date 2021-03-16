//맛집 목록 조회
async function selectRestaurantList(
  connection,
  userIdx,
  area,
  sort,
  category,
  food,
  price,
  parking,
  page,
  limit
) {
  console.log(userIdx);
  var selectRestaurantListQuery = `
  select Res.idx, imgUrl, restaurantName, area, views, reviews
  from Restaurant Res
      inner join Review Rev on Res.idx=Rev.restaurantIdx
  inner join (select count(*) as reviews, Res.idx idx from Review Rev
      inner join Restaurant Res
  where Rev.restaurantIdx = Res.idx
  group by Res.idx) Revs on Revs.idx=Res.idx
  inner join (select count(*) as views, Res.idx idx from Viewed VI
      inner join Restaurant Res
  where VI.restaurantIdx = Res.idx
  group by Res.idx) VIs on VIs.idx=Res.idx
  inner join (select imgUrl imgUrl, Res.idx idx
  from ReviewImg RI
      inner join Review Rev on Rev.idx=RI.reviewIdx
      inner join Restaurant Res on Res.idx=Rev.restaurantIdx
  ORDER BY Rev.createdAt) RIs on RIs.idx=Res.idx`;
  if (category == 1) {
    //가고싶다
    selectRestaurantListQuery += ` inner join (select Res.idx idx
      from Star S
          inner join Restaurant Res on Res.idx=S.restaurantIdx
      where S.userIdx=${userIdx}) St on St.idx=Res.idx`;
  } else if (category == 2) {
    //가봤어요
    selectRestaurantListQuery += ` inner join (select Res.idx idx
      from Visited V
          inner join Restaurant Res on Res.idx=V.restaurantIdx
      where V.userIdx=${userIdx}) Vi on Vi.idx=Res.idx`;
  }

  selectRestaurantListQuery += ` where 1`;
  //지역
  if (typeof area === "object") {
    selectRestaurantListQuery += ` AND (0`;
    for (var element in area) {
      selectRestaurantListQuery += ` OR area='${area[element]}'`;
    }
    selectRestaurantListQuery += `)`;
  } else if (typeof area === "string") {
    selectRestaurantListQuery += ` AND area='${area}'`;
  }
  //음식종류 선택
  if (typeof food === "object") {
    selectRestaurantListQuery += ` AND (0`;
    for (var element in food) {
      selectRestaurantListQuery += ` OR type=${food[element]}`;
    }
    selectRestaurantListQuery += `)`;
  } else if (typeof food === "string") {
    selectRestaurantListQuery += ` AND type=${food}`;
  }
  //가격선택
  if (typeof price === "object") {
    selectRestaurantListQuery += ` AND (0`;
    for (var element in food) {
      selectRestaurantListQuery += ` OR price=${price[element]}`;
    }
    selectRestaurantListQuery += `)`;
  } else if (typeof price === "string") {
    selectRestaurantListQuery += ` AND price=${price}`;
  }
  if (parking) {
    selectRestaurantListQuery += ` AND parking=${parking}`;
  }
  if (sort == 3) {
    selectRestaurantListQuery += ` ORDER BY reviews`;
  }
  selectRestaurantListQuery += ` GROUP BY Res.idx`;
  if (!limit) {
    limit = 20;
  }
  if (page) {
    selectRestaurantListQuery += ` LIMIT ${limit * (page - 1)},${limit}`;
  }
  //console.log(selectRestaurantListQuery);
  const [restaurantRows] = await connection.query(selectRestaurantListQuery);
  return restaurantRows;
}

module.exports = {
  selectRestaurantList,
};
