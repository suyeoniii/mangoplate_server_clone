const { logger } = require("../../../config/winston");
const { pool } = require("../../../config/database");
const secret_config = require("../../../config/secret");
const eatDealProvider = require("../EatDeal/eatDealProvider");
const eatDealDao = require("./eatDealDao");
const baseResponse = require("../../../config/baseResponseStatus");
const { response } = require("../../../config/response");
const { errResponse } = require("../../../config/response");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { connect } = require("http2");
//결제정보 등록
exports.createOrder = async function (orderNo, userIdFromJWT, eatDealIdx, tid) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const orderResult = await eatDealDao.insertOrder(
      connection,
      orderNo,
      userIdFromJWT,
      eatDealIdx,
      tid
    );
    connection.release();

    return response(baseResponse.SUCCESS, {
      orderIdx: orderResult.insertId,
    });
  } catch (err) {
    logger.error(`App - createOrder Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
exports.updateOrderStatus = async function (orderNo, status) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const orderResult = await eatDealDao.updateOrderStatus(
      connection,
      orderNo,
      status
    );
    connection.release();

    return orderResult;
  } catch (err) {
    logger.error(`App - updateeOrder Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
