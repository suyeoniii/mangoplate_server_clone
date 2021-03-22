const baseResponseStatus = require("../../../config/baseResponseStatus");
const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const userDao = require("./userDao");

// Provider: Read 비즈니스 로직 처리

exports.retrieveUserList = async function (email) {
  if (!email) {
    const connection = await pool.getConnection(async (conn) => conn);
    const userListResult = await userDao.selectUser(connection);
    connection.release();

    return userListResult;
  } else {
    const connection = await pool.getConnection(async (conn) => conn);
    const userListResult = await userDao.selectUserEmail(connection, email);
    connection.release();

    return userListResult;
  }
};

exports.retrieveUser = async function (userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userResult = await userDao.selectUserId(connection, userIdx);

  connection.release();

  return userResult[0];
};

exports.emailCheck = async function (email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const emailCheckResult = await userDao.selectUserEmail(connection, email);
  connection.release();

  return emailCheckResult;
};
exports.naverEmailCheck = async function (email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const emailCheckResult = await userDao.selectNaverUserEmail(
    connection,
    email
  );
  connection.release();

  return emailCheckResult;
};
exports.emailVerifyCheck = async function (email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const emailCheckResult = await userDao.selectVerifiedEmail(connection, email);
  connection.release();

  return emailCheckResult;
};

exports.passwordCheck = async function (selectUserPasswordParams) {
  const connection = await pool.getConnection(async (conn) => conn);
  const passwordCheckResult = await userDao.selectUserPassword(
    connection,
    selectUserPasswordParams
  );
  connection.release();
  return passwordCheckResult[0];
};

exports.accountCheck = async function (email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userAccountResult = await userDao.selectUserAccount(connection, email);
  connection.release();

  return userAccountResult;
};
exports.loginCheck = async function (userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const loginResult = await userDao.selectLoginUser(connection, userIdx);
  connection.release();

  return loginResult;
};
exports.retrieveUserInfo = async function (userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userInfoResult = await userDao.selectUserInfo(connection, userIdx);
  connection.release();

  return userInfoResult[0];
};
exports.retrieveUserProfile = async function (userIdx, userIdFromJWT) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userInfoResult = await userDao.selectUserProfile(
    connection,
    userIdx,
    userIdFromJWT
  );
  connection.release();

  return userInfoResult[0];
};
exports.retrieveUserTimeline = async function (userIdx, userIdFromJWT) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userResult = await userDao.selectUserTimeline(
    connection,
    userIdx,
    userIdFromJWT
  );
  connection.release();

  return userResult[0];
};
//내 가고싶다 조회
exports.retrieveMyStar = async function (
  userIdx,
  area,
  sort,
  food,
  price,
  parking,
  page,
  limit,
  lat,
  long
) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userResult = await userDao.selectMyStar(
    connection,
    userIdx,
    area,
    sort,
    food,
    price,
    parking,
    page,
    limit,
    lat,
    long
  );
  connection.release();

  return userResult[0];
};
//다른 사용자 가고싶다 조회
exports.retrieveUserStar = async function (
  userIdx,
  userIdFromJWT,
  area,
  sort,
  food,
  price,
  parking,
  page,
  limit,
  lat,
  long
) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userResult = await userDao.selectUserStar(
    connection,
    userIdx,
    userIdFromJWT,
    area,
    sort,
    food,
    price,
    parking,
    page,
    limit,
    lat,
    long
  );
  connection.release();

  return userResult[0];
};
