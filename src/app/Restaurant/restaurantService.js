const { logger } = require("../../../config/winston");
const { pool } = require("../../../config/database");
const secret_config = require("../../../config/secret");
const restaurantProvider = require("./restaurantProvider");
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
