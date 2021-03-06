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
  long,
  distance
) {
  var selectRestaurantListQuery = `
  select Res.idx,imgUrl, restaurantName, area, FORMAT(views, 0) views, FORMAT(reviews, 0) reviews, score`;

  if (lat && long) {
    selectRestaurantListQuery += `,case when distance < 1
  then Concat(Round(distance*1000,0),'m')
             when distance >=1 then Concat(distance,'km')
  end as distance`;
  }
  if (userIdx) {
    selectRestaurantListQuery += `,ifnull(isStar, 0) isStar, ifnull(isVisited, 0) isVisited`;
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
  inner join (select imgUrl imgUrl, Res.idx idx
  from ReviewImg RI
      inner join Review Rev on Rev.idx=RI.reviewIdx
      inner join Restaurant Res on Res.idx=Rev.restaurantIdx
  ORDER BY Rev.createdAt) RIs on RIs.idx=Res.idx`;

  if (lat && long) {
    selectRestaurantListQuery += ` inner join (SELECT idx,
    Round((6371*acos(cos(radians(${lat}))*cos(radians(lati))*cos(radians(longi)
    -radians(${long}))+sin(radians(${lat}))*sin(radians(lati)))),2)
    AS distance FROM Restaurant`;

    if (distance) {
      selectRestaurantListQuery += ` HAVING distance <= ${distance}`;
    }
    selectRestaurantListQuery += `)dis on dis.idx=Res.idx`;
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

  if (userIdx) {
    selectRestaurantListQuery += `
    left outer join
    (select count(*) isStar, restaurantIdx from Star where userIdx=${userIdx} AND status=0 group by restaurantIdx)
    ST on ST.restaurantIdx=Res.idx
    left outer join
          (select count(*) isVisited, restaurantIdx from Visited where userIdx=${userIdx} AND status=0 group by restaurantIdx)
    VI on VI.restaurantIdx=Res.idx`;
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
  if (food != "0" && food) {
    if (typeof food === "object") {
      selectRestaurantListQuery += ` AND (0`;
      for (var element in food) {
        selectRestaurantListQuery += ` OR type=${food[element]}`;
      }
      selectRestaurantListQuery += `)`;
    } else if (typeof food === "string") {
      selectRestaurantListQuery += ` AND type=${food}`;
    }
  }

  //가격선택
  if (price != "0" && price) {
    if (typeof price === "object") {
      selectRestaurantListQuery += ` AND (0`;
      for (var element in food) {
        selectRestaurantListQuery += ` OR price=${price[element]}`;
      }
      selectRestaurantListQuery += `)`;
    } else if (typeof price === "string") {
      selectRestaurantListQuery += ` AND price=${price}`;
    }
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
  console.log(selectRestaurantListQuery);
  const [restaurantRows] = await connection.query(selectRestaurantListQuery);
  return restaurantRows;
}

async function selectRestaurant(connection, userIdx, restaurantIdx) {
  var selectRestaurantQuery = `select Res.idx, restaurantName, FORMAT(views, 0) views, FORMAT(reviews, 0) reviews, 
  ifnull(FORMAT(stars, 0),'0') stars, score`;
  if (userIdx) {
    selectRestaurantQuery += `,ifnull(isStar,0) isStar, ifnull(visited,0) visited`;
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
left outer join (select MAX(updatedAt) menuUpdatedAt,restaurantIdx from
 RestaurantMenu RM group by restaurantIdx) menuUpdate on menuUpdate.restaurantIdx=Res.idx
 left outer join(select count(*) stars,restaurantIdx from Star where Star.status=0 group by restaurantIdx) Stars on Stars.restaurantIdx=Res.idx
`;

  if (userIdx) {
    selectRestaurantQuery += ` left outer join (select count(*) isStar, restaurantIdx from Star where restaurantIdx=${restaurantIdx} AND userIdx=${userIdx} AND status=0) Star on Star.restaurantIdx=Res.idx
    left outer join(select count(*) visited ,restaurantIdx from Visited where restaurantIdx=${restaurantIdx} AND userIdx=${userIdx} AND status=0) Visited on Visited.restaurantIdx=Res.idx`;
  }
  selectRestaurantQuery += ` where Res.idx=${restaurantIdx};`;

  var selectReviewListQuery = `select Rev.idx reviewIdx, Rev.userIdx, U.nickname,U.profileImg, Rev.score, Rev.contents, FORMAT(ifnull(reviews, 0),0) reviews, FORMAT(ifnull(follower, 0),0) follower
  , FORMAT(ifnull(heart, 0),0) heart,  FORMAT(ifnull(comment, 0),0) comment, DATE_FORMAT(Rev.updatedAt, '%Y-%m-%d') updatedAt`;

  if (userIdx) {
    selectReviewListQuery += `,ifnull(isHeart,0) isHeart`;
  }

  selectReviewListQuery += ` from Review Rev
  inner join Restaurant Res on Rev.restaurantIdx=Res.idx
  inner join User U on U.idx=Rev.userIdx
  left outer join (select count(*) reviews, Rev.idx idx from Review Rev group by Rev.restaurantIdx) as Reviews on Reviews.idx=Res.idx
  left outer join (select count(*) as follower,U.idx idx from Follow F
  inner join User U on F.followIdx=U.idx group by U.idx) F on F.idx=U.idx
  left outer join (select count(*) comment, reviewIdx from Comment group by reviewIdx) Com on Com.reviewIdx=Rev.idx
  left outer join (select count(*) heart, `;
  if (userIdx) {
    selectReviewListQuery += ` count(case when Heart.status=0 AND userIdx=${userIdx} then 1 end) isHeart,`;
  }
  selectReviewListQuery += ` reviewIdx from Heart group by reviewIdx) Heart on Heart.reviewIdx=Rev.idx
  where Res.idx=${restaurantIdx} limit 3;`;

  const selectMenuQuery = `select menuName, FORMAT(price, 0) menuPrice, isBest from RestaurantMenu RM
  where restaurantIdx=? order by isBest;`;

  const selectMenuImgQuery = `select idx menuImgIdx, imgUrl from MenuImg where restaurantIdx=?;
  `;

  const selectTagQuery = `select idx tagIdx,tagName from RestaurantTag RT
  inner join Tag T on T.idx=RT.tagIdx
  where restaurantIdx=?;`;

  const selectImgQuery = `select RI.idx reviewImgIdx, imgUrl from Review Rev
  inner join ReviewImg RI on RI.reviewIdx=Rev.idx
  where Rev.restaurantIdx=? order by Rev.createdAt DESC limit 0,4;
  `;

  const selectReviewImgQuery = `select RI.idx reviewImgIdx,imgUrl from ReviewImg RI
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
async function selectStar(connection, restaurantIdx, userIdx) {
  const selectStarQuery = `select idx,status from Star where restaurantIdx=? AND userIdx=?;`;

  const restaurantRows = await connection.query(selectStarQuery, [
    restaurantIdx,
    userIdx,
  ]);
  return restaurantRows[0];
}
async function insertStar(connection, userIdx, restaurantIdx, contents) {
  const insertStarQuery = `INSERT INTO Star(userIdx, restaurantIdx) VALUES(?, ?);`;

  const restaurantRows = await connection.query(insertStarQuery, [
    userIdx,
    restaurantIdx,
  ]);
  return restaurantRows;
}
async function updateStarContent(connection, userIdx, restaurantIdx, contents) {
  const updateStarContentQuery = `UPDATE Star SET contents=? where userIdx=? AND restaurantIdx=?`;

  const restaurantRows = await connection.query(updateStarContentQuery, [
    contents,
    userIdx,
    restaurantIdx,
  ]);
  return restaurantRows;
}
async function updateStarStatus(connection, userIdx, restaurantIdx, status) {
  const updateStarStatusQuery = `UPDATE Star SET status=? where userIdx=? AND restaurantIdx=?`;

  const restaurantRows = await connection.query(updateStarStatusQuery, [
    status,
    userIdx,
    restaurantIdx,
  ]);
  return restaurantRows;
}
async function selectVisited(connection, restaurantIdx, userIdx) {
  const selectVisitedQuery = `select count(case when TIMESTAMPDIFF(Hour, createdAt, current_timestamp()) < 24
  then 1
end)  as isCreated from Visited where restaurantIdx=? and userIdx=? and status=0;`;

  const restaurantRows = await connection.query(selectVisitedQuery, [
    restaurantIdx,
    userIdx,
  ]);
  return restaurantRows[0];
}
async function selectVisitedById(connection, visited) {
  const selectVisitedQuery = `select idx, userIdx from Visited where idx=? and status=0;`;

  const visitedRows = await connection.query(selectVisitedQuery, [visited]);
  return visitedRows[0];
}
async function insertVisited(
  connection,
  userIdx,
  restaurantIdx,
  contents,
  isPrivate
) {
  //가봤어요 추가
  const insertVisitedQuery = `INSERT INTO Visited(userIdx,restaurantIdx,contents,isPrivate) VALUES(?,?,?,?)`;

  const restaurantRows = await connection.query(insertVisitedQuery, [
    userIdx,
    restaurantIdx,
    contents,
    isPrivate,
  ]);

  return restaurantRows[0];
}
async function updateVisited(connection, visitedIdx, contents, isPrivate) {
  const updateVisitedQuery = `UPDATE Visited SET contents=?, isPrivate=? where idx=?`;

  const visitedRows = await connection.query(updateVisitedQuery, [
    contents,
    isPrivate,
    visitedIdx,
  ]);
  return visitedRows[0];
}
async function updateVisitedStatus(connection, visitedIdx) {
  const updateVisitedQuery = `UPDATE Visited SET status=1 where idx=?`;

  const visitedRows = await connection.query(updateVisitedQuery, [visitedIdx]);
  return visitedRows[0];
}
async function deleteStarStatus(connection, userIdx, restaurantIdx) {
  const updateStarStatusQuery = `UPDATE Star SET status=1 WHERE userIdx=? and restaurantIdx=?`;

  const starRows = await connection.query(updateStarStatusQuery, [
    userIdx,
    restaurantIdx,
  ]);
  return starRows[0];
}
async function selectRestaurantSearch(
  connection,
  userIdx,
  q,
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
  select Res.idx,imgUrl, restaurantName, area, FORMAT(views, 0) views, FORMAT(reviews, 0) reviews, score`;

  if (lat && long) {
    selectRestaurantListQuery += `,case when distance < 1
  then Concat(Round(distance*1000,0),'m')
             when distance >=1 then Concat(distance,'km')
  end as distance`;
  }
  if (userIdx) {
    selectRestaurantListQuery += `,ifnull(isStar, 0) isStar, ifnull(isVisited, 0) isVisited`;
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
  inner join (select imgUrl imgUrl, Res.idx idx
  from ReviewImg RI
      inner join Review Rev on Rev.idx=RI.reviewIdx
      inner join Restaurant Res on Res.idx=Rev.restaurantIdx
  ORDER BY Rev.createdAt) RIs on RIs.idx=Res.idx`;

  if (lat && long) {
    selectRestaurantListQuery += ` inner join (SELECT idx,
    Round((6371*acos(cos(radians(${lat}))*cos(radians(lati))*cos(radians(longi)
    -radians(${long}))+sin(radians(${lat}))*sin(radians(lati)))),2)
    AS distance FROM Restaurant`;

    selectRestaurantListQuery += `)dis on dis.idx=Res.idx`;
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

  if (userIdx) {
    selectRestaurantListQuery += `
    left outer join
    (select count(*) isStar, restaurantIdx from Star where userIdx=${userIdx} AND status=0 group by restaurantIdx)
    ST on ST.restaurantIdx=Res.idx
    left outer join
          (select count(*) isVisited, restaurantIdx from Visited where userIdx=${userIdx} AND status=0 group by restaurantIdx)
    VI on VI.restaurantIdx=Res.idx`;
  }

  if (q) {
    selectRestaurantListQuery += ` left outer join (select tagName, restaurantIdx idx from Tag  T inner join RestaurantTag RT on T.idx=RT.tagIdx)
    T on T.idx=Res.idx`;
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
  if (food != "0" && food) {
    if (typeof food === "object") {
      selectRestaurantListQuery += ` AND (0`;
      for (var element in food) {
        selectRestaurantListQuery += ` OR type=${food[element]}`;
      }
      selectRestaurantListQuery += `)`;
    } else if (typeof food === "string") {
      selectRestaurantListQuery += ` AND type=${food}`;
    }
  }

  //가격선택
  if (price != "0" && price) {
    if (typeof price === "object") {
      selectRestaurantListQuery += ` AND (0`;
      for (var element in food) {
        selectRestaurantListQuery += ` OR price=${price[element]}`;
      }
      selectRestaurantListQuery += `)`;
    } else if (typeof price === "string") {
      selectRestaurantListQuery += ` AND price=${price}`;
    }
  }
  if (parking) {
    selectRestaurantListQuery += ` AND parking=${parking}`;
  }

  for (var element in q) {
    selectRestaurantListQuery += ` AND (restaurantName Like '%${q[element]}%' OR area Like '%${q[element]}%' OR tagName Like '%${q[element]}%')`;
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
  console.log(selectRestaurantListQuery);
  const [restaurantRows] = await connection.query(selectRestaurantListQuery);
  return restaurantRows;
}
async function insertRestaurant(
  connection,
  restaurantName,
  lat,
  long,
  phone,
  food,
  area,
  doro,
  jibeon
) {
  const insertRestaurantQuery = `INSERT INTO Restaurant(restaurantName, lati, longi, phone, type, area, doro, jibeon)
  VALUES(?,?,?,?,?,?,?,?)`;

  const restaurantRows = await connection.query(insertRestaurantQuery, [
    restaurantName,
    lat,
    long,
    phone,
    food,
    area,
    doro,
    jibeon,
  ]);
  return restaurantRows[0];
}
async function selectImages(connection, restaurantIdx, page, limit) {
  const selectRestaurantQuery = `select distinct Res.idx restaurantIdx, Res.restaurantName from ReviewImg RI
  inner join Review Rev on Rev.idx=RI.reviewIdx
  inner join Restaurant Res on Res.idx=Rev.restaurantIdx
  where Rev.restaurantIdx=?`;

  const selectImagesQuery = `select RI.idx imgIdx, RI.imgUrl from ReviewImg RI
  inner join Review Rev on Rev.idx=RI.reviewIdx
  where Rev.restaurantIdx=? order by RI.updatedAt DESC LIMIT ${
    limit * (page - 1)
  },${limit}`;

  const [restaurantRows] = await connection.query(selectRestaurantQuery, [
    restaurantIdx,
  ]);
  const [imageRows] = await connection.query(selectImagesQuery, [
    restaurantIdx,
  ]);
  console.log(imageRows);
  restaurantRows[0].img = imageRows;

  return restaurantRows[0];
}
async function selectReviews(
  connection,
  userIdx,
  restaurantIdx,
  sort,
  score,
  page,
  limit
) {
  var selectRestaurantQuery = `select Res.idx restaurantIdx, restaurantName, Rev.idx reviewIdx,
  U.idx userIdx, U.nickname,U.profileImg,
  Ifnull(FORMAT(reviews,0),0) reviews, Ifnull(FORMAT(follower,0),0) follower,
  Rev.score,Rev.contents,
  Ifnull(FORMAT(heart,0),0) heart,Ifnull(FORMAT(comment,0),0) comment,
  case
 when TIMESTAMPDIFF(Minute, Rev.createdAt, current_timestamp()) < 60
  then CONCAT(TIMESTAMPDIFF(Minute, Rev.createdAt, current_timestamp()),'분 전')
  when TIMESTAMPDIFF(Hour, Rev.createdAt, current_timestamp()) < 24
  then CONCAT(TIMESTAMPDIFF(Hour, Rev.createdAt, current_timestamp()),'시간 전')
 when TIMESTAMPDIFF(Day, Rev.createdAt, current_timestamp()) < 8
  then CONCAT(TIMESTAMPDIFF(Day, Rev.createdAt, current_timestamp()),'일 전')
 else DATE_FORMAT(Rev.createdAt, '%Y-%m-%d')
  end  as createdAt`;

  if (userIdx) {
    selectRestaurantQuery += `,ifnull(isHeart, 0) isHeart`;
  }
  selectRestaurantQuery += ` from Review Rev
inner join Restaurant Res on Res.idx=Rev.restaurantIdx
inner join User U on U.idx=Rev.userIdx
left outer join (select count(*) reviews, Rev.idx idx from Review Rev group by Rev.restaurantIdx) as Reviews on Reviews.idx=Res.idx
left outer join (select count(*) as follower,U.idx idx from Follow F
inner join User U on F.followIdx=U.idx group by U.idx) F on F.idx=U.idx
left outer join (select count(*) heart`;

  if (userIdx) {
    selectRestaurantQuery += `,count(case when userIdx=${userIdx} then 1 end) isHeart`;
  }

  selectRestaurantQuery += `, reviewIdx from Heart where status =0 group by reviewIdx) Heart on Heart.reviewIdx=Rev.idx
left outer join (select count(*) comment, reviewIdx from Comment where status = 0 group by reviewIdx) C on C.reviewIdx=Rev.idx
where Rev.restaurantIdx=?`;

  if (score) {
    selectRestaurantQuery += ` AND (score=${score})`;
  }

  if (sort == 1) {
    //최신순
    selectRestaurantQuery += ` ORDER BY Rev.updatedAt DESC`;
  } else {
    //좋아요순
    selectRestaurantQuery += ` ORDER BY Heart DESC`;
  }
  selectRestaurantQuery += ` LIMIT ${limit * (page - 1)},${limit}`;
  const selectImagesQuery = `select RI.idx reviewImgIdx,imgUrl from ReviewImg RI where RI.reviewIdx=?;`;

  const [reviewRows] = await connection.query(selectRestaurantQuery, [
    restaurantIdx,
  ]);
  //리뷰 이미지
  for (i in reviewRows) {
    const [reviewImgRows] = await connection.query(
      selectImagesQuery,
      reviewRows[i].reviewIdx
    );
    reviewRows[i].reviewImg = reviewImgRows;
  }

  return reviewRows;
}
async function selectRecommend(connection, userIdx, restaurantIdx, lat, long) {
  var selectRecommendQuery = `select distinct Res.idx restaurantIdx, restaurantName, imgUrl, area, FORMAT(ifnull(views,0),0) views, FORMAT(ifnull(reviews,0),0) reviews,score`;

  if (userIdx) selectRecommendQuery += `,ifnull(isStar,0) isStar`;

  selectRecommendQuery += ` from Restaurant Res
  left outer join (select R.idx idx, R.restaurantIdx restaurantIdx from Review R group by R.restaurantIdx) Rev on Rev.restaurantIdx=Res.idx
  left outer join (select imgUrl,RI.reviewIdx idx from ReviewImg RI group by RI.reviewIdx) RIs on RIs.idx=Res.idx
  inner join (select Round(sum(new_score)/count(*), 1) as score,count(*) as reviews, Rev.idx, Rev.restaurantIdx resIdx
   from Review Rev
      inner join (select
      case
      when Rev.score = 0 then 5
      when Rev.score = 1 then 3
      when Rev.score = 2 then 1
  end as new_score, Rev.idx idx
  from Review Rev) as Score on Score.idx=Rev.idx
  group by Rev.restaurantIdx) as new_Rev on new_Rev.resIdx = Res.idx`;

  if (userIdx) {
    selectRecommendQuery += ` left outer join (select restaurantIdx,count(case when userIdx=${userIdx} then 1 end) isStar from Star S where status=0 group by restaurantIdx) ST on ST.restaurantIdx=Res.idx
    `;
  }
  selectRecommendQuery += `inner join (SELECT idx,
    Round((6371*acos(cos(radians('${lat}'))*cos(radians(lati))*cos(radians(longi)
    -radians('${long}'))+sin(radians('${lat}'))*sin(radians(lati)))),2)
    AS distance
  FROM Restaurant
Having distance <= 2) dis on dis.idx=Res.idx
left outer join (select count(*) stars,restaurantIdx from Star where status=0 group by Star.restaurantIdx) S on S.restaurantIdx=Res.idx
left outer join (select count(*) visited,restaurantIdx from Visited where status=0 group by Visited.restaurantIdx) VI on VI.restaurantIdx=Res.idx
where Res.idx != ?
ORDER BY ifnull(stars,0)+ifnull(visited,0)*2 DESC limit 4;`;

  const [reviewRows] = await connection.query(selectRecommendQuery, [
    restaurantIdx,
  ]);
  console.log(selectRecommendQuery);
  return reviewRows;
}
async function selectLocation(connection, restaurantIdx) {
  const selectLocationQuery = `select idx,lati,longi from Restaurant where status=0 and idx=?`;

  const [restaurantRows] = await connection.query(selectLocationQuery, [
    restaurantIdx,
  ]);

  return restaurantRows[0];
}
module.exports = {
  selectRestaurantList,
  selectRestaurant,
  selectRestaurantId,
  updateRestaurantViews,
  selectStar,
  insertStar,
  updateStarContent,
  updateStarStatus,
  selectVisited,
  insertVisited,
  selectVisitedById,
  updateVisited,
  updateVisitedStatus,
  deleteStarStatus,
  selectRestaurantSearch,
  insertRestaurant,
  selectImages,
  selectReviews,
  selectRecommend,
  selectLocation,
};
