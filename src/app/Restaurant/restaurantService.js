const { logger } = require("../../../config/winston");
const { pool } = require("../../../config/database");
const secret_config = require("../../../config/secret");
const restaurantProvider = require("./restaurantProvider");
const userProvider = require("../User/userProvider");
const restaurantDao = require("./restaurantDao");
const baseResponse = require("../../../config/baseResponseStatus");
const { response } = require("../../../config/response");
const { errResponse } = require("../../../config/response");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { connect } = require("http2");

// Service: Create, Update, Delete 비즈니스 로직 처리

exports.addRestaurantViews = async function (restaurantIdx) {
  try {
    const restaurantRows = await restaurantProvider.restaurantCheck(
      restaurantIdx
    );
    console.log(restaurantRows);
    if (restaurantRows.length < 1)
      return errResponse(baseResponse.RESTAURANT_ID_NOT_EXIST);

    const connection = await pool.getConnection(async (conn) => conn);

    const restaurantIdResult = await restaurantDao.updateRestaurantViews(
      connection,
      restaurantIdx
    );
    connection.release();
    return response(baseResponse.SUCCESS);
  } catch (err) {
    logger.error(`App - createRestaurant Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//가고싶다 등록, 수정
exports.updateStars = async function (
  userIdx,
  restaurantIdx,
  contents,
  status
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

    //star 테이블 확인
    const starRows = await restaurantProvider.retrieveStar(
      restaurantIdx,
      userIdx
    );
    if (starRows.length < 1) {
      //insert
      const connection = await pool.getConnection(async (conn) => conn);
      const starResult = await restaurantDao.insertStar(
        connection,
        userIdx,
        restaurantIdx,
        contents,
        status
      );
      connection.release();
      return response(baseResponse.SUCCESS, {
        starIdx: starResult[0].insertId,
      });
    } else {
      //update
      if (status) {
        //status
        const connection = await pool.getConnection(async (conn) => conn);
        const starResult = await restaurantDao.updateStarStatus(
          connection,
          userIdx,
          restaurantIdx,
          contents,
          status
        );
        connection.release();
        return response(baseResponse.SUCCESS, { starIdx: starRows[0].idx });
      } else {
        //content
        const connection = await pool.getConnection(async (conn) => conn);
        const starResult = await restaurantDao.updateStarContent(
          connection,
          userIdx,
          restaurantIdx,
          contents,
          status
        );
        connection.release();
        return response(baseResponse.SUCCESS, { starIdx: starRows[0].idx });
      }
    }

    return response({ starIdx: starRows[0].idx });
  } catch (err) {
    logger.error(`App - createStar Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
