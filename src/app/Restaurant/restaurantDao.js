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
  select Res.idx, imgUrl, restaurantName, area, views, reviews, score
  from Restaurant Res
  inner join (select Round(sum(new_score)/count(*), 1) as score,count(*) as reviews, Rev.idx, Rev.restaurantIdx resIdx
  from Review Rev
      inner join (select
      case
      when Rev.score = 0 then 5
      when Rev.score = 1 then 3
      when Rev.score = 2 then 1
  end as new_score, Rev.idx idx
  from Review Rev) as Score on Score.idx=Rev.idx
  group by Rev.restaurantIdx) as new_Rev on new_Rev.resIdx = Res.idx
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
  selectRestaurantListQuery += ` GROUP BY Res.idx`;
  if (!sort || sort == 0) {
    selectRestaurantListQuery += ` ORDER BY score DESC`;
  } else if (sort == 1) {
    selectRestaurantListQuery += ` ORDER BY views DESC`;
  } else if (sort == 2) {
    selectRestaurantListQuery += ` ORDER BY reviews DESC`;
  }
  if (!limit) {
    limit = 20;
  }
  if (!page) {
    page = 1;
  }
  if (page) {
    selectRestaurantListQuery += ` LIMIT ${limit * (page - 1)},${limit}`;
  }
  console.log(selectRestaurantListQuery);
  const [restaurantRows] = await connection.query(selectRestaurantListQuery);
  return restaurantRows;
}

module.exports = {
  selectRestaurantList,
};
