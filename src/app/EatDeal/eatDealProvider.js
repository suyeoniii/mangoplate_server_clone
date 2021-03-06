const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");
const eatDealDao = require("./eatDealDao");

// Provider: Read 비즈니스 로직 처리

exports.retrieveEatDeals = async function (area, page, limit) {
  const connection = await pool.getConnection(async (conn) => conn);
  const eatDealResult = await eatDealDao.selectEatDeals(
    connection,
    area,
    page,
    limit
  );
  connection.release();
  return eatDealResult;
};
exports.retrieveEatDealById = async function (eatDealIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const eatDealResult = await eatDealDao.selectEatDealById(
    connection,
    eatDealIdx
  );
  connection.release();
  return eatDealResult;
};
exports.eatDealCheck = async function (eatDealIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const eatDealResult = await eatDealDao.selectEatDealCheck(
    connection,
    eatDealIdx
  );
  connection.release();
  return eatDealResult;
};
exports.orderCheck = async function (orderNo) {
  const connection = await pool.getConnection(async (conn) => conn);
  const eatDealResult = await eatDealDao.selectOrderCheck(connection, orderNo);
  connection.release();
  return eatDealResult;
};
exports.orderNoCheck = async function (orderNo) {
  const connection = await pool.getConnection(async (conn) => conn);
  const eatDealResult = await eatDealDao.selectOrderNo(connection, orderNo);
  connection.release();
  return eatDealResult;
};
