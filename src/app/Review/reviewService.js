const { logger } = require("../../../config/winston");
const { pool } = require("../../../config/database");
const secret_config = require("../../../config/secret");
const reviewProvider = require("./reviewProvider");
const userProvider = require("../User/userProvider");
const restaurantProvider = require("../Restaurant/restaurantProvider");
const reviewDao = require("./reviewDao");
const baseResponse = require("../../../config/baseResponseStatus");
const { response } = require("../../../config/response");
const { errResponse } = require("../../../config/response");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { connect } = require("http2");

// Service: Create, Update, Delete 비즈니스 로직 처리

//리뷰 등록
exports.createReview = async function (
  userIdx,
  restaurantIdx,
  img,
  score,
  contents
) {
  try {
    //userIdx 확인
    const userRows = await userProvider.retrieveUser(userIdx);
    if (userRows.length < 1) return errResponse(baseResponse.USER_ID_NOT_EXIST);

    //restaurantIdx 확인
    const restaurantRows = await restaurantProvider.restaurantCheck(
      restaurantIdx
    );
    if (restaurantRows.length < 1)
      return errResponse(baseResponse.RESTAURANT_ID_NOT_EXIST);

    //insert
    const connection = await pool.getConnection(async (conn) => conn);
    const reviewResult = await reviewDao.insertReview(
      connection,
      userIdx,
      restaurantIdx,
      img,
      score,
      contents
    );
    connection.release();
    return response(baseResponse.SUCCESS, {
      reviewIdx: reviewResult.insertId,
    });
  } catch (err) {
    logger.error(`App - createReview Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//리뷰 수정
exports.updateReview = async function (
  userIdx,
  reviewIdx,
  img,
  score,
  contents
) {
  try {
    //userIdx 확인
    const userRows = await userProvider.retrieveUser(userIdx);
    if (userRows.length < 1) return errResponse(baseResponse.USER_ID_NOT_EXIST);

    //reviewIdx 확인
    const reviewIdxRows = await reviewProvider.reviewCheck(reviewIdx);
    if (reviewIdxRows.length < 1)
      return errResponse(baseResponse.REVIEW_ID_NOT_EXIST);
    if (reviewIdxRows[0].userIdx !== userIdx)
      return errResponse(baseResponse.REVIEW_USER_NOT_MATCH);

    //update
    const connection = await pool.getConnection(async (conn) => conn);
    const reviewResult = await reviewDao.updateReview(
      connection,
      userIdx,
      reviewIdx,
      img,
      score,
      contents
    );
    connection.release();

    return response(baseResponse.SUCCESS, {
      reviewIdx: reviewIdx,
    });
  } catch (err) {
    console.log(err);
    logger.error(`App - updateReview Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//리뷰 삭제
exports.updateReviewStatus = async function (userIdx, reviewIdx) {
  try {
    //userIdx 확인
    const userRows = await userProvider.retrieveUser(userIdx);
    if (userRows.length < 1) return errResponse(baseResponse.USER_ID_NOT_EXIST);

    //reviewIdx 확인
    const reviewIdxRows = await reviewProvider.reviewCheck(reviewIdx);
    if (reviewIdxRows.length < 1)
      return errResponse(baseResponse.REVIEW_ID_NOT_EXIST);
    if (reviewIdxRows[0].userIdx !== userIdx)
      return errResponse(baseResponse.REVIEW_USER_NOT_MATCH);

    //update
    const connection = await pool.getConnection(async (conn) => conn);
    const reviewResult = await reviewDao.updateReviewStatus(
      connection,
      reviewIdx
    );
    connection.release();

    return response(baseResponse.SUCCESS, {
      reviewIdx: reviewIdx,
    });
  } catch (err) {
    logger.error(`App - updateReviewStatus Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//리뷰 좋아요 등록,해제
exports.createReviewLike = async function (userIdx, reviewIdx) {
  try {
    //userIdx 확인
    const userRows = await userProvider.retrieveUser(userIdx);
    if (userRows.length < 1) return errResponse(baseResponse.USER_ID_NOT_EXIST);

    //reviewIdx 확인
    const reviewIdxRows = await reviewProvider.reviewCheck(reviewIdx);
    if (reviewIdxRows.length < 1)
      return errResponse(baseResponse.REVIEW_ID_NOT_EXIST);

    //heart 테이블 확인
    const heartRows = await reviewProvider.retrieveHeart(reviewIdx, userIdx);

    if (heartRows.length < 1) {
      //insert
      const connection = await pool.getConnection(async (conn) => conn);
      const reviewHeartResult = await reviewDao.insertReviewHeart(
        connection,
        reviewIdx,
        userIdx
      );
      connection.release();
      return response(baseResponse.SUCCESS, {
        status: 1,
      });
    } else {
      //update
      var status = 0;
      if (heartRows[0].status === 0) status = 1;
      const connection = await pool.getConnection(async (conn) => conn);
      const reviewHeartResult = await reviewDao.updateReviewHeart(
        connection,
        reviewIdx,
        userIdx,
        status
      );
      connection.release();
      return response(baseResponse.SUCCESS, { status: status });
    }
  } catch (err) {
    logger.error(`App - createReviewLike Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//리뷰 댓글 등록 API
exports.createReviewComment = async function (userIdx, reviewIdx, contents) {
  try {
    //userIdx 확인
    const userRows = await userProvider.retrieveUser(userIdx);
    if (userRows.length < 1) return errResponse(baseResponse.USER_ID_NOT_EXIST);

    //reviewIdx 확인
    const reviewIdxRows = await reviewProvider.reviewCheck(reviewIdx);
    if (reviewIdxRows.length < 1)
      return errResponse(baseResponse.REVIEW_ID_NOT_EXIST);

    //insert
    const connection = await pool.getConnection(async (conn) => conn);
    const reviewResult = await reviewDao.insertReviewComment(
      connection,
      userIdx,
      reviewIdx,
      contents
    );
    connection.release();
    return response(baseResponse.SUCCESS, {
      reviewIdx: reviewResult.insertId,
    });
  } catch (err) {
    logger.error(`App - createReviewComment Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//리뷰 댓글 수정 API
exports.updateReviewComment = async function (userIdx, commentIdx, contents) {
  try {
    //userIdx 확인
    const userRows = await userProvider.retrieveUser(userIdx);
    if (userRows.length < 1) return errResponse(baseResponse.USER_ID_NOT_EXIST);

    //commentIdx 확인
    const commentIdxRows = await reviewProvider.commentCheck(commentIdx);
    if (commentIdxRows.length < 1)
      return errResponse(baseResponse.COMMENT_ID_NOT_EXIST);
    if (commentIdxRows[0].userIdx !== userIdx)
      return errResponse(baseResponse.COMMENT_USER_NOT_MATCH);

    //insert
    const connection = await pool.getConnection(async (conn) => conn);
    const commentResult = await reviewDao.updateReviewComment(
      connection,
      userIdx,
      commentIdx,
      contents
    );
    connection.release();
    return response(baseResponse.SUCCESS, {
      commentIdx: commentIdx,
    });
  } catch (err) {
    logger.error(`App - updateReviewComment Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//리뷰 댓글 삭제 API
exports.updateReviewCommentStatus = async function (userIdx, commentIdx) {
  try {
    //userIdx 확인
    const userRows = await userProvider.retrieveUser(userIdx);
    if (userRows.length < 1) return errResponse(baseResponse.USER_ID_NOT_EXIST);

    //commentIdx 확인
    const commentIdxRows = await reviewProvider.commentCheck(commentIdx);
    if (commentIdxRows.length < 1)
      return errResponse(baseResponse.COMMENT_ID_NOT_EXIST);
    if (commentIdxRows[0].userIdx !== userIdx)
      return errResponse(baseResponse.COMMENT_USER_NOT_MATCH);

    //update status
    const connection = await pool.getConnection(async (conn) => conn);
    const commentResult = await reviewDao.updateReviewCommentStatus(
      connection,
      userIdx,
      commentIdx
    );
    connection.release();
    return response(baseResponse.SUCCESS, {
      commentIdx: commentIdx,
    });
  } catch (err) {
    logger.error(
      `App - updateReviewCommentStatus Service error\n: ${err.message}`
    );
    return errResponse(baseResponse.DB_ERROR);
  }
};
