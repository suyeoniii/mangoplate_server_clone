const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const restaurantDao = require("./restaurantDao");
const userDao = require("../User/userDao");

// Provider: Read 비즈니스 로직 처리

exports.retrieveRestaurantList = async function (
  userIdx,
  area,
  sort,
  category,
  food,
  price,
  parking,
  page,
  limit,
  lat,
  long,
  distance
) {
  if (userIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const userIdCheckResult = await userDao.selectUserId(connection, userIdx);
    connection.release();

    if (userIdCheckResult.length < 1)
      return errResponse(baseResponse.USER_ID_NOT_EXIST);
  }

  const connection = await pool.getConnection(async (conn) => conn);
  const restaurantListResult = await restaurantDao.selectRestaurantList(
    connection,
    userIdx,
    area,
    sort,
    category,
    food,
    price,
    parking,
    page,
    limit,
    lat,
    long,
    distance
  );
  connection.release();
  return restaurantListResult;
};

exports.retrieveRestaurant = async function (userIdx, restaurantIdx) {
  if (userIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const userIdCheckResult = await userDao.selectUserId(connection, userIdx);
    connection.release();

    if (userIdCheckResult.length < 1)
      return errResponse(baseResponse.USER_ID_NOT_EXIST);
  }
  const connection = await pool.getConnection(async (conn) => conn);
  const restaurantResult = await restaurantDao.selectRestaurant(
    connection,
    userIdx,
    restaurantIdx
  );
  connection.release();
  return restaurantResult;
};
exports.restaurantCheck = async function (restaurantIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const restaurantResult = await restaurantDao.selectRestaurantId(
    connection,
    restaurantIdx
  );
  connection.release();
  return restaurantResult;
};
exports.retrieveStar = async function (restaurantIdx, userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const starResult = await restaurantDao.selectStar(
    connection,
    restaurantIdx,
    userIdx
  );
  connection.release();
  return starResult;
};
exports.retrieveVisited = async function (restaurantIdx, userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const visitedResult = await restaurantDao.selectVisited(
    connection,
    restaurantIdx,
    userIdx
  );
  connection.release();
  return visitedResult;
};
exports.retrieveVisitedById = async function (visited) {
  const connection = await pool.getConnection(async (conn) => conn);
  const visitedResult = await restaurantDao.selectVisitedById(
    connection,
    visited
  );
  connection.release();
  return visitedResult;
};
exports.retrieveRestaurantSearch = async function (
  userIdx,
  q,
  area,
  sort,
  category,
  food,
  price,
  parking,
  page,
  limit,
  lat,
  long
) {
  if (userIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const userIdCheckResult = await userDao.selectUserId(connection, userIdx);
    connection.release();

    if (userIdCheckResult.length < 1)
      return errResponse(baseResponse.USER_ID_NOT_EXIST);
  }

  const connection = await pool.getConnection(async (conn) => conn);
  const restaurantListResult = await restaurantDao.selectRestaurantSearch(
    connection,
    userIdx,
    q,
    area,
    sort,
    category,
    food,
    price,
    parking,
    page,
    limit,
    lat,
    long
  );
  connection.release();
  return restaurantListResult;
};
exports.retrieveImages = async function (restaurantIdx, page, limit) {
  const connection = await pool.getConnection(async (conn) => conn);
  const restaurantListResult = await restaurantDao.selectImages(
    connection,
    restaurantIdx,
    page,
    limit
  );
  connection.release();
  return restaurantListResult;
};
