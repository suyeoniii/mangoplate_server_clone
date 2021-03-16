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
  limit
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
    limit
  );
  connection.release();
  console.log(typeof restaurantListResult[0].views);
  return restaurantListResult;
};
