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
//가고싶다 메모 등록, 수정
exports.updateStars = async function (userIdx, restaurantIdx, contents) {
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
    console.log(starRows.length);
    if (starRows.length < 1) {
      return errResponse(baseResponse.STAR_NOT_EXIST);
    }
    if (starRows[0].status === 1) {
      return errResponse(baseResponse.STAR_NOT_EXIST);
    }
    //content
    const connection = await pool.getConnection(async (conn) => conn);
    const starResult = await restaurantDao.updateStarContent(
      connection,
      userIdx,
      restaurantIdx,
      contents
    );
    connection.release();
    return response(baseResponse.SUCCESS, { status: true });
  } catch (err) {
    logger.error(`App - createStar Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//가고싶다 등록, 수정
exports.updateStarStatus = async function (userIdx, restaurantIdx) {
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
        restaurantIdx
      );
      connection.release();
      return response(baseResponse.SUCCESS, {
        status: true,
      });
    } else {
      //update

      var status = starRows[0].status;
      //등록/해제
      const connection = await pool.getConnection(async (conn) => conn);
      const starResult = await restaurantDao.updateStarStatus(
        connection,
        userIdx,
        restaurantIdx,
        !status
      );
      connection.release();
      return response(baseResponse.SUCCESS, { status: status });
    }
  } catch (err) {
    logger.error(`App - createStar Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//가봤어요 등록
exports.createVisited = async function (
  userIdx,
  restaurantIdx,
  contents,
  isPrivate
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

    //visited 테이블 확인 - 하루안에 등록한게 있으면 등록못함
    const visitedRows = await restaurantProvider.retrieveVisited(
      restaurantIdx,
      userIdx
    );

    if (visitedRows.length > 0 && visitedRows[0].isCreated > 0)
      return errResponse(baseResponse.VISITED_LIMIT_EXCEEDED);

    //star 테이블 확인 - 있으면 삭제해야해서
    const starRows = await restaurantProvider.retrieveStar(
      restaurantIdx,
      userIdx
    );
    var isStar = 0;

    if (starRows.length > 0 && starRows[0].idx > 0) isStar = 1;

    //insert
    const connection = await pool.getConnection(async (conn) => conn);

    await connection.beginTransaction();

    const visitedResult = await restaurantDao.insertVisited(
      connection,
      userIdx,
      restaurantIdx,
      contents,
      isPrivate
    );

    if (isStar) {
      const starResult = await restaurantDao.deleteStarStatus(
        connection,
        userIdx,
        restaurantIdx
      );
    }

    await connection.commit();

    connection.release();
    return response(baseResponse.SUCCESS, {
      visitedIdx: visitedResult.insertId,
    });
  } catch (err) {
    logger.error(`App - createVisited Service error\n: ${err.message}`);
    await connection.rollback();
    return errResponse(baseResponse.DB_ERROR);
  }
};
//가봤어요 수정
exports.updateVisited = async function (
  userIdx,
  visitedIdx,
  contents,
  isPrivate
) {
  try {
    //visited, userIdx 확인
    const visitedRows = await restaurantProvider.retrieveVisitedById(
      visitedIdx
    );
    if (visitedRows.length < 1)
      return errResponse(baseResponse.VISITED_ID_NOT_EXIST);
    if (visitedRows[0].userIdx !== userIdx)
      return errResponse(baseResponse.VISITED_USER_NOT_MATCH);

    //update
    const connection = await pool.getConnection(async (conn) => conn);
    const visitedResult = await restaurantDao.updateVisited(
      connection,
      visitedIdx,
      contents,
      isPrivate
    );
    connection.release();

    return response(baseResponse.SUCCESS, {
      visitedIdx: visitedIdx,
    });
  } catch (err) {
    logger.error(`App - updateVisited Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//가봤어요 삭제
exports.updateVisitedStatus = async function (userIdx, visitedIdx) {
  try {
    //visited, userIdx 확인
    const visitedRows = await restaurantProvider.retrieveVisitedById(
      visitedIdx
    );
    if (visitedRows.length < 1)
      return errResponse(baseResponse.VISITED_ID_NOT_EXIST);
    if (visitedRows[0].userIdx !== userIdx)
      return errResponse(baseResponse.VISITED_USER_NOT_MATCH);

    //update
    const connection = await pool.getConnection(async (conn) => conn);
    const visitedResult = await restaurantDao.updateVisitedStatus(
      connection,
      visitedIdx
    );
    connection.release();

    return response(baseResponse.SUCCESS, {
      visitedIdx: visitedIdx,
    });
  } catch (err) {
    logger.error(`App - updateVisitedStatus Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//식당 등록
exports.createRestaurant = async function (
  restaurantName,
  lat,
  long,
  phone,
  food,
  area,
  doro,
  jibeon
) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const restaurantResult = await restaurantDao.insertRestaurant(
      connection,
      restaurantName,
      lat,
      long,
      phone,
      food,
      area,
      doro,
      jibeon
    );
    connection.release();

    return response(baseResponse.SUCCESS, {
      restaurantIdx: restaurantResult.insertId,
    });
  } catch (err) {
    logger.error(`App - createRestaurant Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
