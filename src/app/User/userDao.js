// 모든 유저 조회
async function selectUser(connection) {
  const selectUserListQuery = `
                SELECT email, nickname 
                FROM User WHERE status=0;
                `;
  const [userRows] = await connection.query(selectUserListQuery);
  return userRows;
}

// 이메일로 회원 조회
async function selectUserEmail(connection, email) {
  const selectUserEmailQuery = `
                SELECT idx, userEmail
                FROM User 
                WHERE userEmail = ? AND loginType=0 AND status=0;
                `;
  const [emailRows] = await connection.query(selectUserEmailQuery, email);
  return emailRows;
}
// 이메일로 회원 조회
async function selectNaverUserEmail(connection, email) {
  const selectUserEmailQuery = `
                SELECT idx, userEmail, loginType
                FROM User 
                WHERE userEmail = ? AND loginType=1 AND status=0;
                `;
  const [emailRows] = await connection.query(selectUserEmailQuery, email);
  return emailRows;
}
//이메일 인증 조회
async function selectVerifiedEmail(connection, email) {
  const selectUserEmailQuery = `
                SELECT idx, email, case
                when TIMESTAMPDIFF(Hour, updatedAt, current_timestamp()) > 24
                    then 1
                end as isExpired, isVerified
                FROM EmailCheck
                WHERE email = ?;
                `;
  const [emailRows] = await connection.query(selectUserEmailQuery, email);
  return emailRows;
}

// userId 회원 조회
async function selectUserId(connection, userId) {
  const selectUserIdQuery = `
                 SELECT idx, userEmail, nickname, status
                 FROM User U
                 WHERE idx = ? and status=0;
                 `;
  const [userRow] = await connection.query(selectUserIdQuery, userId);
  return userRow;
}

// 유저 생성
async function insertUser(connection, insertUserParams) {
  const insertUserQuery = `
        INSERT INTO User(userEmail, password, phone, nickname, profileImg)
        VALUES (?, ?, ?, ?, ?);
    `;
  const insertUserRow = await connection.query(
    insertUserQuery,
    insertUserParams
  );

  return insertUserRow;
}

// 패스워드 체크
async function selectUserPassword(connection, selectUserPasswordParams) {
  const selectUserPasswordQuery = `
        SELECT userEmail, nickname, password
        FROM User 
        WHERE userEmail = ? AND password = ?;`;
  const selectUserPasswordRow = await connection.query(
    selectUserPasswordQuery,
    selectUserPasswordParams
  );

  return selectUserPasswordRow;
}

// 유저 계정 상태 체크 (jwt 생성 위해 id 값도 가져온다.)
async function selectUserAccount(connection, email) {
  const selectUserAccountQuery = `
        SELECT status, idx
        FROM User 
        WHERE userEmail = ?;`;
  const selectUserAccountRow = await connection.query(
    selectUserAccountQuery,
    email
  );
  return selectUserAccountRow[0];
}

async function updateUser(connection, id, nickname) {
  const updateUserQuery = `
  UPDATE User 
  SET nickname = ?
  WHERE id = ?;`;
  const updateUserRow = await connection.query(updateUserQuery, [nickname, id]);
  return updateUserRow[0];
}

async function updateEmailVerify(connection, email) {
  const updateEmailQuery = `
  UPDATE EmailCheck
  SET isVerified = 1
  WHERE email = ?;`;
  const updateEmailRow = await connection.query(updateEmailQuery, email);
  return updateEmailRow[0];
}

async function insertEmailVerify(connection, email) {
  const insertEmailQuery = `
  INSERT INTO EmailCheck(email, isVerified)
  VALUES(?, 1);
  `;
  const insertEmailRow = await connection.query(insertEmailQuery, email);
  return insertEmailRow[0];
}

//네이버 로그인
async function insertNaverUser(connection, insertUserParams) {
  const insertEmailQuery = `
  INSERT INTO User(userEmail, nickname, phone, profileImg, loginType)
  VALUES(?, ?, ?, ?, 1);
  `;
  const insertEmailRow = await connection.query(
    insertEmailQuery,
    insertUserParams
  );
  return insertEmailRow;
}
//jwt status 업데이트
async function updateJwtStatus(connection, userIdx) {
  const updateJwtStatusQuery = `
  UPDATE Jwt SET status=1 where userIdx=?
  `;
  const updateJwtStatusRow = await connection.query(
    updateJwtStatusQuery,
    userIdx
  );
  return updateJwtStatusRow;
}

//jwt token 업데이트
async function updateJwtToken(connection, updateJwtTokenParams) {
  const updateJwtTokenQuery = `
  UPDATE Jwt SET token=?, status=0 where userIdx=?
  `;
  const updateJwtTokenRow = await connection.query(
    updateJwtTokenQuery,
    updateJwtTokenParams
  );
  return updateJwtTokenRow;
}
//login user 조회
async function selectLoginUser(connection, userIdx) {
  const selectJwtQuery = `
  SELECT userIdx, status FROM Jwt WHERE userIdx=?;
  `;
  const selectJwtRow = await connection.query(selectJwtQuery, userIdx);
  return selectJwtRow;
}
//login 추가
async function insertLoginUser(connection, updateJwtTokenParams) {
  const insertJwtQuery = `
  INSERT INTO Jwt(token, userIdx) VALUES(?,?);
  `;
  const insertJwtRow = await connection.query(
    insertJwtQuery,
    updateJwtTokenParams
  );
  return insertJwtRow;
}
//마이페이지 조회
async function selectUserInfo(connection, userIdx) {
  const selectUserInfoQuery = `select U.idx userIdx, U.profileImg, U.nickname,
  ifnull(follower,0) follower, ifnull(following,0) following, ifnull(reviews,0) reviews, ifnull(visited,0) visited,ifnull(photos,0) photos, ifnull(star,0) star
from User U
left outer join (select count(*) follower ,followIdx from Follow where status=0 group by followIdx) Fer on Fer.followIdx=U.idx
left outer join (select count(*) following ,followerIdx from Follow where status=0 group by followerIdx) Fin on Fin.followerIdx=U.idx
left outer join (select Rev.userIdx,count(*) reviews from Review Rev where Rev.status=0 group by Rev.userIdx) R on R.userIdx=U.idx
left outer join (select VI.userIdx,count(*) visited from Visited VI where VI.status=0 group by VI.userIdx) V on V.userIdx=U.idx
left outer join (select Rev.userIdx,count(*) photos from ReviewImg RI inner join Review Rev on RI.reviewIdx=Rev.idx where RI.status=0 AND Rev.status=0 group by Rev.userIdx) RR on RR.userIdx=U.idx
left outer join (select ST.userIdx,count(*) star from Star ST where ST.status=0 group by ST.userIdx) S on S.userIdx=U.idx where U.idx=? AND U.status=0`;
  const selectUserInfoRow = await connection.query(
    selectUserInfoQuery,
    userIdx
  );
  return selectUserInfoRow;
}
//프로필 조회
async function selectUserProfile(connection, userIdx, userIdFromJWT) {
  var selectUserInfoQuery = `select U.idx userIdx, U.profileImg, U.nickname,
  ifnull(follower,0) follower, ifnull(following,0) following`;

  if (userIdFromJWT) {
    selectUserInfoQuery += `, ifnull(isFollow, 0) isFollow `;
  }

  selectUserInfoQuery += `,ifnull(reviews,0) reviews, ifnull(visited,0) visited,ifnull(photos,0) photos, ifnull(star,0) star
  from User U
  left outer join (select count(*) follower ,followIdx from Follow where status=0 group by followIdx) Fer on Fer.followIdx=U.idx
  left outer join (select count(*) following ,followerIdx from Follow where status=0 group by followerIdx) Fin on Fin.followerIdx=U.idx
  left outer join (select Rev.userIdx,count(*) reviews from Review Rev where Rev.status=0 group by Rev.userIdx) R on R.userIdx=U.idx
  left outer join (select VI.userIdx,count(*) visited from Visited VI where VI.status=0 group by VI.userIdx) V on V.userIdx=U.idx
  left outer join (select Rev.userIdx,count(*) photos from ReviewImg RI inner join Review Rev on RI.reviewIdx=Rev.idx where RI.status=0 AND Rev.status=0 group by Rev.userIdx) RR on RR.userIdx=U.idx
  left outer join (select ST.userIdx,count(*) star from Star ST where ST.status=0 group by ST.userIdx) S on S.userIdx=U.idx
  `;
  if (userIdFromJWT) {
    selectUserInfoQuery += ` left outer join(select count(case when Follow.status=0 then 1 end) isFollow, followIdx from Follow where followerIdx=${userIdFromJWT}) F on F.followIdx = U.idx
    `;
  }
  selectUserInfoQuery += `where U.idx=? AND U.status=0`;

  const selectUserInfoRow = await connection.query(
    selectUserInfoQuery,
    userIdx
  );
  return selectUserInfoRow;
}
//타임라인 조회
async function selectUserTimeline(connection, userIdx, userIdFromJWT) {
  var selectUserTimelineQuery = ``;

  const selectUserTimelineRow = await connection.query(
    selectUserTimelineQuery,
    userIdx
  );
  return selectUserTimelineRow;
}
//내 가고싶다 조회
async function selectMyStar(
  connection,
  userIdx,
  area,
  sort,
  food,
  price,
  parking,
  page,
  limit,
  lat,
  long
) {
  var selectUserStarQuery = `
  select restaurantIdx, imgUrl, area, restaurantName,
       score,
       Format(views,0) views, ifnull(Format(reviews,0),0) reviews,
       contents
       ,count(case when userIdx=${userIdx} then 1
           else 0 end) isStar`;

  if (sort == 3 && lat && long) {
    selectUserStarQuery += `,case when distance < 1
            then Concat(Round(distance*1000,0),'m')
                       when distance >=1 then Concat(distance,'km')
            end as distance`;
  }

  selectUserStarQuery += `
from Star S
inner join Restaurant Res on Res.idx=S.restaurantIdx
left outer join (select Round(sum(new_score)/count(*), 1) as score,
                     count(*) as reviews,
                     Rev.idx idx, Rev.restaurantIdx resIdx
  from Review Rev
      inner join (select
      case
      when Rev.score = 0 then 5
      when Rev.score = 1 then 3
      when Rev.score = 2 then 1
  end as new_score, Rev.idx idx
  from Review Rev) as Score on Score.idx=Rev.idx
  group by Rev.restaurantIdx) as Rev on Rev.resIdx = Res.idx
left outer join (select RI.reviewIdx, RI.imgUrl from ReviewImg RI where RI.status=0) RI on RI.reviewIdx=Rev.idx`;

  if (lat && long) {
    selectUserStarQuery += ` inner join (SELECT idx,
  Round((6371*acos(cos(radians(${lat}))*cos(radians(lati))*cos(radians(longi)
  -radians(${long}))+sin(radians(${lat}))*sin(radians(lati)))),2)
  AS distance FROM Restaurant)dis on dis.idx=Res.idx`;
  }

  selectUserStarQuery += ` where userIdx = ${userIdx} AND Res.status = 0 AND S.status = 0`;

  //지역
  if (typeof area === "object") {
    selectUserStarQuery += ` AND (0`;
    for (var element in area) {
      selectUserStarQuery += ` OR area='${area[element]}'`;
    }
    selectUserStarQuery += `)`;
  } else if (typeof area === "string") {
    selectUserStarQuery += ` AND area='${area}'`;
  }
  //음식종류 선택
  if (typeof food === "object") {
    selectUserStarQuery += ` AND (0`;
    for (var element in food) {
      selectUserStarQuery += ` OR type=${food[element]}`;
    }
    selectUserStarQuery += `)`;
  } else if (typeof food === "string") {
    selectUserStarQuery += ` AND type=${food}`;
  }
  //가격선택
  if (typeof price === "object") {
    selectUserStarQuery += ` AND (0`;
    for (var element in food) {
      selectUserStarQuery += ` OR price=${price[element]}`;
    }
    selectUserStarQuery += `)`;
  } else if (typeof price === "string") {
    selectUserStarQuery += ` AND price=${price}`;
  }
  if (parking) {
    selectUserStarQuery += ` AND parking=${parking}`;
  }

  selectUserStarQuery += ` group by restaurantIdx`;

  if (sort == 1) {
    selectUserStarQuery += ` ORDER BY score DESC`;
  } else if (sort == 2) {
    selectUserStarQuery += ` ORDER BY reviews DESC`;
  } else if (sort == 3 && lat && long) {
    selectUserStarQuery += ` ORDER BY dis.distance`;
  } else {
    selectUserStarQuery += ` ORDER BY S.updatedAt DESC`;
  }

  if (!limit) {
    limit = 20;
  }
  if (!page) {
    page = 1;
  }
  if (page) {
    selectUserStarQuery += ` LIMIT ${limit * (page - 1)},${limit}`;
  }
  console.log(selectUserStarQuery);
  const selectUserStarRow = await connection.query(selectUserStarQuery);
  return selectUserStarRow;
}

//가고싶다 조회
async function selectUserStar(
  connection,
  userIdx,
  userIdFromJWT,
  area,
  sort,
  food,
  price,
  parking,
  page,
  limit,
  lat,
  long
) {
  var selectUserStarQuery = `select restaurantIdx, imgUrl, area, restaurantName,
  score,
  Format(views,0) views, ifnull(Format(reviews,0),0) reviews`;

  if (userIdFromJWT) {
    selectUserStarQuery += `,count(case when userIdx=${userIdFromJWT} then 1
      else 0 end) isStar`;
  }

  if (sort == 3 && lat && long) {
    selectUserStarQuery += `,case when distance < 1
            then Concat(Round(distance*1000,0),'m')
                       when distance >=1 then Concat(distance,'km')
            end as distance`;
  }

  selectUserStarQuery += `
from Star S
inner join Restaurant Res on Res.idx=S.restaurantIdx
left outer join (select Round(sum(new_score)/count(*), 1) as score,
                     count(*) as reviews,
                     Rev.idx idx, Rev.restaurantIdx resIdx
  from Review Rev
      inner join (select
      case
      when Rev.score = 0 then 5
      when Rev.score = 1 then 3
      when Rev.score = 2 then 1
  end as new_score, Rev.idx idx
  from Review Rev) as Score on Score.idx=Rev.idx
  group by Rev.restaurantIdx) as Rev on Rev.resIdx = Res.idx
left outer join (select RI.reviewIdx, RI.imgUrl from ReviewImg RI where RI.status=0) RI on RI.reviewIdx=Rev.idx`;

  if (lat && long) {
    selectUserStarQuery += ` inner join (SELECT idx,
  Round((6371*acos(cos(radians(${lat}))*cos(radians(lati))*cos(radians(longi)
  -radians(${long}))+sin(radians(${lat}))*sin(radians(lati)))),2)
  AS distance FROM Restaurant)dis on dis.idx=Res.idx`;
  }

  selectUserStarQuery += ` where userIdx = ${userIdx} AND Res.status = 0 AND S.status = 0`;

  //지역
  if (typeof area === "object") {
    selectUserStarQuery += ` AND (0`;
    for (var element in area) {
      selectUserStarQuery += ` OR area='${area[element]}'`;
    }
    selectUserStarQuery += `)`;
  } else if (typeof area === "string") {
    selectUserStarQuery += ` AND area='${area}'`;
  }
  //음식종류 선택
  if (typeof food === "object") {
    selectUserStarQuery += ` AND (0`;
    for (var element in food) {
      selectUserStarQuery += ` OR type=${food[element]}`;
    }
    selectUserStarQuery += `)`;
  } else if (typeof food === "string") {
    selectUserStarQuery += ` AND type=${food}`;
  }
  //가격선택
  if (typeof price === "object") {
    selectUserStarQuery += ` AND (0`;
    for (var element in food) {
      selectUserStarQuery += ` OR price=${price[element]}`;
    }
    selectUserStarQuery += `)`;
  } else if (typeof price === "string") {
    selectUserStarQuery += ` AND price=${price}`;
  }
  if (parking) {
    selectUserStarQuery += ` AND parking=${parking}`;
  }

  selectUserStarQuery += ` group by restaurantIdx`;

  if (sort == 1) {
    selectUserStarQuery += ` ORDER BY score DESC`;
  } else if (sort == 2) {
    selectUserStarQuery += ` ORDER BY reviews DESC`;
  } else if (sort == 3 && lat && long) {
    selectUserStarQuery += ` ORDER BY dis.distance`;
  } else {
    selectUserStarQuery += ` ORDER BY S.updatedAt DESC`;
  }

  if (!limit) {
    limit = 20;
  }
  if (!page) {
    page = 1;
  }
  if (page) {
    selectUserStarQuery += ` LIMIT ${limit * (page - 1)},${limit}`;
  }
  console.log(selectUserStarQuery);
  const selectUserStarRow = await connection.query(
    selectUserStarQuery,
    userIdx
  );
  return selectUserStarRow;
}

module.exports = {
  selectUser,
  selectUserEmail,
  selectUserId,
  insertUser,
  selectUserPassword,
  selectUserAccount,
  updateUser,
  updateEmailVerify,
  insertEmailVerify,
  selectVerifiedEmail,
  insertNaverUser,
  selectNaverUserEmail,
  updateJwtStatus,
  updateJwtToken,
  selectLoginUser,
  insertLoginUser,
  selectUserInfo,
  selectUserProfile,
  selectUserTimeline,
  selectUserStar,
  selectMyStar,
};
