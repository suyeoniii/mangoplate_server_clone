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
