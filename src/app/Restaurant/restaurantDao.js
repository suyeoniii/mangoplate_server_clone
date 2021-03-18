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
  limit,
  lat,
  long
) {
  var selectRestaurantListQuery = `
  select Res.idx,imgUrl, restaurantName, area, views, reviews, score`;

  if (lat && long) {
    selectRestaurantListQuery += `,case when distance < 1
  then Concat(Round(distance*1000,0),'m')
             when distance >=1 then Concat(distance,'km')
  end as distance`;
  }

  selectRestaurantListQuery += ` from Restaurant Res
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

  if (lat && long) {
    selectRestaurantListQuery += ` inner join (SELECT idx,
    Round((6371*acos(cos(radians(${lat}))*cos(radians(lati))*cos(radians(longi)
    -radians(${long}))+sin(radians(${lat}))*sin(radians(lati)))),2)
    AS distance FROM Restaurant) dis on dis.idx=Res.idx`;
  }
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
  } else if (sort == 3) {
    selectRestaurantListQuery += ` ORDER BY dis.distance`;
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

  const [restaurantRows] = await connection.query(selectRestaurantListQuery);
  return restaurantRows;
}

async function selectRestaurant(connection, userIdx, restaurantIdx) {
  var selectRestaurantQuery = `select Res.idx, restaurantName, views, reviews, stars, score`;
  if (userIdx) {
    selectRestaurantQuery += `,isStar, visited`;
  }
  selectRestaurantQuery += `,doro, jibeon, phone
  ,DATE_FORMAT(Res.updatedAt, '%Y-%m-%d') infoUpdatedAt, openingHours, breakTime, lastOrder, closedDays,
        case when price=0
         then '정보 없음'
            when price=1
         then '만원 미만'
 when price=2
         then '만원-2만원'
 when price=3
         then '2만원-3만원'
 when price=4
         then '3만원-4만원'
 when price=5
         then '4만원 이상'
 end as price,
 DATE_FORMAT(menuUpdatedAt, '%Y-%m-%d') menuUpdatedAt, good, soso, bad
   from Restaurant Res
   inner join (select Round(sum(new_score)/count(*), 1) as score,
                      count(*) as reviews,
                      count(case when Rev.score=0 then 1 end) as good,
                      count(case when Rev.score=2 then 1 end) as soso,
                      count(case when Rev.score=3 then 1 end) as bad,
                      Rev.idx, Rev.restaurantIdx resIdx
   from Review Rev
       inner join (select
       case
       when Rev.score = 0 then 5
       when Rev.score = 1 then 3
       when Rev.score = 2 then 1
   end as new_score, Rev.idx idx
   from Review Rev) as Score on Score.idx=Rev.idx
   group by Rev.restaurantIdx) as new_Rev on new_Rev.resIdx = Res.idx
 inner join (select MAX(updatedAt) menuUpdatedAt,restaurantIdx from
 RestaurantMenu RM group by restaurantIdx) menuUpdate on menuUpdate.restaurantIdx=Res.idx
 inner join(select count(*) stars,restaurantIdx from Star where Star.status=0 group by restaurantIdx) Stars on Stars.restaurantIdx=Res.idx
`;

  if (userIdx) {
    selectRestaurantQuery += ` left outer join (select count(*) isStar, restaurantIdx from Star where restaurantIdx=${restaurantIdx} AND userIdx=${userIdx} AND status=0) Star on Star.restaurantIdx=Res.idx
    left outer join(select count(*) visited ,restaurantIdx from Visited where restaurantIdx=${restaurantIdx} AND userIdx=${userIdx} AND status=0) Visited on Visited.restaurantIdx=Res.idx`;
  }
  selectRestaurantQuery += ` where Res.idx=${restaurantIdx};`;

  var selectReviewListQuery = `select Rev.idx reviewIdx, Rev.userIdx, U.nickname,U.profileImg, Rev.score, Rev.contents, reviews, follower
  , heart, comment, DATE_FORMAT(Rev.updatedAt, '%Y-%m-%d') updatedAt`;

  if (userIdx) {
    selectReviewListQuery += `,isHeart`;
  }

  selectReviewListQuery += ` from Review Rev
  inner join Restaurant Res on Rev.restaurantIdx=Res.idx
  inner join User U on U.idx=Rev.userIdx
  inner join (select count(*) reviews, Rev.idx idx from Review Rev group by Rev.restaurantIdx) as Reviews on Reviews.idx=Res.idx
  inner join (select count(*) as follower,U.idx idx from Follow F
  inner join User U on F.followIdx=U.idx group by U.idx) F on F.idx=U.idx
  inner join (select count(*) comment, reviewIdx from Comment group by reviewIdx) Com on Com.reviewIdx=Rev.idx
  inner join (select count(*) heart, `;
  if (userIdx) {
    selectReviewListQuery += ` count(case when Heart.status=0 AND userIdx=${userIdx} then 1 end) isHeart,`;
  }
  selectReviewListQuery += ` reviewIdx from Heart group by reviewIdx) Heart on Heart.reviewIdx=Rev.idx
  where Res.idx=${restaurantIdx} limit 3;`;

  const selectMenuQuery = `select menuName, price menuPrice, isBest from RestaurantMenu RM
  where restaurantIdx=? order by isBest;`;

  const selectMenuImgQuery = `select imgUrl from MenuImg where restaurantIdx=?;
  `;

  const selectTagQuery = `select tagName from RestaurantTag RT
  inner join Tag T on T.idx=RT.tagIdx
  where restaurantIdx=?;`;

  const selectImgQuery = `select imgUrl from Review Rev
  inner join ReviewImg RI on RI.reviewIdx=Rev.idx
  where Rev.restaurantIdx=? order by Rev.createdAt DESC limit 0,4;
  `;

  const selectReviewImgQuery = `select imgUrl from ReviewImg RI
  inner join Review Rev on Rev.idx=RI.reviewIdx
  where RI.reviewIdx=?;`;
  console.log(selectRestaurantQuery);
  const [restaurantRows] = await connection.query(selectRestaurantQuery);
  const [imgRows] = await connection.query(selectImgQuery, restaurantIdx);
  const [menuRows] = await connection.query(selectMenuQuery, restaurantIdx);
  const [menuImgRows] = await connection.query(
    selectMenuImgQuery,
    restaurantIdx
  );
  const [tagRows] = await connection.query(selectTagQuery, restaurantIdx);
  const [reviewListRows] = await connection.query(selectReviewListQuery);

  //리뷰 이미지
  for (i in reviewListRows) {
    const [reviewImgRows] = await connection.query(
      selectReviewImgQuery,
      reviewListRows[i].reviewIdx
    );
    reviewListRows[i].reviewImg = reviewImgRows;
  }
  console.log(restaurantRows);
  restaurantRows[0].img = imgRows;
  restaurantRows[0].menu = menuRows;
  restaurantRows[0].menuImg = menuImgRows;
  restaurantRows[0].tag = tagRows;
  restaurantRows[0].reviewList = reviewListRows;

  return restaurantRows;
}
async function selectRestaurantId(connection, restaurantIdx) {
  const selectRestaurantIdQuery = `select idx
  from Restaurant where idx=?;`;

  const restaurantRows = await connection.query(
    selectRestaurantIdQuery,
    restaurantIdx
  );
  console.log(restaurantRows[0]);
  return restaurantRows[0];
}
async function updateRestaurantViews(connection, restaurantIdx) {
  const updateRestaurantViewsQuery = `UPDATE Restaurant SET views = views+1 where idx=?;`;

  const restaurantRows = await connection.query(
    updateRestaurantViewsQuery,
    restaurantIdx
  );
  return restaurantRows[0];
}
module.exports = {
  selectRestaurantList,
  selectRestaurant,
  selectRestaurantId,
  updateRestaurantViews,
};
