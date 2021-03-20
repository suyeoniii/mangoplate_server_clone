async function selectReviewById(connection, reviewIdx, userIdx) {
  //리뷰 조회
  var selectReviewQuery = `select Rev.idx reviewIdx, Rev.userIdx, Rev.restaurantIdx, U.nickname,U.profileImg, Rev.score, reviews, follower,
  Res.restaurantName, Res.area ,Rev.contents, heart, comment,
  DATE_FORMAT(Rev.updatedAt, '%Y-%m-%d') updatedAt`;

  if (userIdx) {
    selectReviewQuery += `,ifnull(isStar, 0) isStar, ifnull(visited,0) visited, isHeart`;
  }

  selectReviewQuery += ` from Review Rev
  inner join Restaurant Res on Rev.restaurantIdx=Res.idx
  inner join User U on U.idx=Rev.userIdx
  inner join (select count(*) reviews, Rev.idx idx from Review Rev group by Rev.restaurantIdx) as Reviews on Reviews.idx=Res.idx
  inner join (select count(*) as follower,U.idx idx from Follow F
  inner join User U on F.followIdx=U.idx group by U.idx) F on F.idx=U.idx
  inner join (select count(*) comment, reviewIdx from Comment group by reviewIdx) Com on Com.reviewIdx=Rev.idx
  inner join (select count(*) heart`;

  if (userIdx) {
    selectReviewQuery += `,count(case when Heart.status=0 AND userIdx=${userIdx} then 1 end) isHeart, reviewIdx from Heart group by reviewIdx) Heart on Heart.reviewIdx=Rev.idx
  left outer join (select count(case when Star.status=0 then 1 end) isStar, restaurantIdx from Star where userIdx=${userIdx} AND status=0 group by restaurantIdx) S on S.restaurantIdx=Res.idx
  left outer join (select count(case when Visited.status=0 then 1 end) visited, restaurantIdx from Visited where userIdx=${userIdx} AND status=0 group by restaurantIdx) V on V.restaurantIdx=Res.idx
  `;
  } else {
    selectReviewQuery += `, reviewIdx from Heart group by reviewIdx) Heart on Heart.reviewIdx=Rev.idx`;
  }
  selectReviewQuery += ` where Rev.idx=?;`;

  //리뷰이미지 조회
  const selectReviewImgQuery = `select imgUrl from ReviewImg RI where RI.reviewIdx=?;`;

  //댓글 조회
  const selectCommentsQuery = `select C.idx commentIdx, C.userIdx, U.nickname, U.profileImg, C.contents,
  case
      when TIMESTAMPDIFF(Minute, C.updatedAt, current_timestamp()) < 60
       then CONCAT(TIMESTAMPDIFF(Minute, C.updatedAt, current_timestamp()),'분 전')
       when TIMESTAMPDIFF(Hour, C.updatedAt, current_timestamp()) < 24
       then CONCAT(TIMESTAMPDIFF(Hour, C.updatedAt, current_timestamp()),'시간 전')
      when TIMESTAMPDIFF(Day, C.updatedAt, current_timestamp()) < 8
       then CONCAT(TIMESTAMPDIFF(Day, C.updatedAt, current_timestamp()),'일 전')
      else DATE_FORMAT(C.updatedAt, '%Y-%m-%d')
       end  as updatedAt
from Comment C
inner join User U on U.idx=C.userIdx
where reviewIdx=?;`;

  const [reviewRows] = await connection.query(selectReviewQuery, reviewIdx);
  const [reviewImgRows] = await connection.query(
    selectReviewImgQuery,
    reviewIdx
  );
  const [commentRows] = await connection.query(selectCommentsQuery, reviewIdx);

  reviewRows[0].reviewImg = reviewImgRows;
  reviewRows[0].comments = commentRows;
  return reviewRows;
}
async function insertReview(
  connection,
  userIdx,
  restaurantIdx,
  img,
  score,
  contents
) {
  try {
    const insertReviewQuery = `INSERT INTO Review(userIdx,restaurantIdx,score,contents) VALUES(?,?,?,?);`;
    const lastInsertIdQuery = `select LAST_INSERT_ID() idx;`;
    const insertReviewImgQuery = `INSERT INTO ReviewImg(reviewIdx, imgUrl) VALUES(?, ?);`;

    await connection.beginTransaction();
    const reviewRows = await connection.query(insertReviewQuery, [
      userIdx,
      restaurantIdx,
      score,
      contents,
    ]);

    const reviewIdx = await connection.query(lastInsertIdQuery);

    if (img) {
      for (i in img) {
        const reviewImgRows = await connection.query(insertReviewImgQuery, [
          reviewIdx[0][0].idx,
          img[i].imgUrl,
        ]);
      }
    }

    await connection.commit();
    return reviewRows[0];
  } catch (err) {
    console.error(err);
    await connection.rollback();
  }
}
async function selectReviewId(connection, reviewIdx) {
  const selectReviewQuery = `select idx, userIdx from Review where idx=? and status=0`;

  const reviewRows = await connection.query(selectReviewQuery, [reviewIdx]);
  return reviewRows[0];
}
async function updateReview(
  connection,
  userIdx,
  reviewIdx,
  img,
  score,
  contents
) {
  try {
    const updateReviewQuery = `UPDATE Review SET score=?,contents=? where idx=?;`;
    const updateReviewImgQuery = `UPDATE ReviewImg SET imgUrl = ? where reviewIdx=?;`;

    await connection.beginTransaction();
    const reviewRows = await connection.query(updateReviewQuery, [
      score,
      contents,
      reviewIdx,
    ]);

    if (img) {
      for (i in img) {
        const reviewImgRows = await connection.query(updateReviewImgQuery, [
          img[i].imgUrl,
          reviewIdx,
        ]);
      }
    }
    await connection.commit();
    return reviewRows[0];
  } catch (err) {
    console.error(err);
    await connection.rollback();
  }
}
async function updateReviewStatus(connection, reviewIdx) {
  const updateReviewQuery = `UPDATE Review SET status=1 where idx=?`;

  const reviewRows = await connection.query(updateReviewQuery, [reviewIdx]);
  return reviewRows[0];
}
async function selectReviewHeart(connection, reviewIdx, userIdx) {
  const selectReviewHeartQuery = `SELECT idx, status from Heart where reviewIdx=? AND userIdx=?;`;

  const reviewRows = await connection.query(selectReviewHeartQuery, [
    reviewIdx,
    userIdx,
  ]);
  return reviewRows[0];
}
async function insertReviewHeart(connection, reviewIdx, userIdx) {
  const insertReviewHeartQuery = `INSERT INTO Heart(reviewIdx, userIdx) VALUES(?,?)`;

  const reviewRows = await connection.query(insertReviewHeartQuery, [
    reviewIdx,
    userIdx,
  ]);
  return reviewRows[0];
}
async function updateReviewHeart(connection, reviewIdx, userIdx, status) {
  const updateReviewHeartQuery = `UPDATE Heart SET status=? WHERE reviewIdx=? AND userIdx=?`;

  const reviewRows = await connection.query(updateReviewHeartQuery, [
    status,
    reviewIdx,
    userIdx,
  ]);
  return reviewRows[0];
}
module.exports = {
  selectReviewById,
  insertReview,
  selectReviewId,
  updateReview,
  updateReviewStatus,
  selectReviewHeart,
  insertReviewHeart,
  updateReviewHeart,
};
