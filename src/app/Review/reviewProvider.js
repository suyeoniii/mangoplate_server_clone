const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");
const reviewDao = require("./reviewDao");

// Provider: Read 비즈니스 로직 처리

exports.retrieveReviewById = async function (reviewIdx, userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const reviewResult = await reviewDao.selectReviewById(
    connection,
    reviewIdx,
    userIdx
  );
  connection.release();
  return reviewResult;
};
