const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");
const reviewDao = require("./reviewDao");

// Provider: Read 비즈니스 로직 처리

exports.retrieveReviewById = async function (reviewIdx, userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const reviewResult = await reviewDao.selectReviewById(
    connection,
    reviewIdx,
    userIdx
  );
  connection.release();
  return reviewResult;
};
exports.reviewCheck = async function (reviewIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const reviewResult = await reviewDao.selectReviewId(connection, reviewIdx);
  connection.release();
  return reviewResult;
};
exports.retrieveHeart = async function (reviewIdx, userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const reviewResult = await reviewDao.selectReviewHeart(
    connection,
    reviewIdx,
    userIdx
  );
  connection.release();
  return reviewResult;
};
exports.commentCheck = async function (commentIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const commentResult = await reviewDao.selectCommentIdx(
    connection,
    commentIdx
  );
  connection.release();
  return commentResult;
};
exports.retrieveReviews = async function (
  userIdx,
  area,
  category,
  score,
  page,
  limit
) {
  const connection = await pool.getConnection(async (conn) => conn);
  const reviewResult = await reviewDao.selectReviews(
    connection,
    userIdx,
    area,
    category,
    score,
    page,
    limit
  );
  connection.release();
  return reviewResult;
};
