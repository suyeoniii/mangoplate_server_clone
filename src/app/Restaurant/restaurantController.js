const jwtMiddleware = require("../../../config/jwtMiddleware");
const restaurantProvider = require("../../app/Restaurant/restaurantProvider");
const restaurantService = require("../../app/Restaurant/restaurantService");
const baseResponse = require("../../../config/baseResponseStatus");
const secret_config = require("../../../config//secret");
const { response, errResponse } = require("../../../config/response");
const jwt = require("jsonwebtoken");

const regexEmail = require("regex-email");
const { emit } = require("nodemon");

/**
 * API No.
 * API Name : 맛집조회 (+지역 선택)
 * [GET] /app/restaurants?area=""
 */
exports.getRestaurants = async function (req, res) {
  /**
   * Query String: area, sort, category, food, price, parking, page, limit
   */
  const token = req.headers["x-access-token"] || req.query.token;
  var userIdFromJWT;
  const { area, sort, category, food, price, parking, page, limit } = req.query;
  if (token) {
    jwt.verify(token, secret_config.jwtsecret, (err, verifiedToken) => {
      if (verifiedToken) {
        userIdFromJWT = verifiedToken.userIdx;
      }
    });
    if (!userIdFromJWT) {
      return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));
    }
  }

  if (sort > 2 || sort < 0)
    return res.send(response(baseResponse.RESTAURANT_SORT_ERROR_TYPE));
  if (category > 2 || category < 0)
    return res.send(response(baseResponse.RESTAURANT_CATEGORY_ERROR_TYPE));
  if ((category == 1 || category == 2) && !token)
    return res.send(response(baseResponse.TOKEN_EMPTY));

  if (typeof food === "string") {
    if (food > 8 || food < 0)
      return res.send(response(baseResponse.RESTAURANT_FOOD_ERROR_TYPE));
  } else {
    for (var element in food) {
      if (food[element] > 8 || food[element] < 0)
        return res.send(response(baseResponse.RESTAURANT_FOOD_ERROR_TYPE));
    }
  }
  if (typeof price === "string") {
    if (price > 4 || price < 0)
      return res.send(response(baseResponse.RESTAURANT_PRICE_ERROR_TYPE));
  } else {
    for (var element in price) {
      if (price[element] > 4 || price[element] < 0)
        return res.send(response(baseResponse.RESTAURANT_PRICE_ERROR_TYPE));
    }
  }
  if (parking > 2 || parking < 0)
    return res.send(response(baseResponse.RESTAURANT_PARKING_ERROR_TYPE));

  const restaurantListResult = await restaurantProvider.retrieveRestaurantList(
    userIdFromJWT,
    area,
    sort,
    category,
    food,
    price,
    parking,
    page,
    limit
  );
  return res.send(response(baseResponse.SUCCESS, restaurantListResult));
};
