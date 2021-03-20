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
    if (reviewIdxRows.userIdx < 1)
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
    if (reviewIdxRows.userIdx < 1)
      return errResponse(baseResponse.REVIEW_USER_NOT_MATCH);

    //update
    const connection = await pool.getConnection(async (conn) => conn);
    const reviewResult = await reviewDao.updateReviewStatus(
      connection,
      userIdx,
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
    if (reviewIdxRows.userIdx < 1)
      return errResponse(baseResponse.REVIEW_USER_NOT_MATCH);

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
