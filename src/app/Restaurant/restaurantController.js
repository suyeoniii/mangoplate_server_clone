const jwtMiddleware = require("../../../config/jwtMiddleware");
const restaurantProvider = require("../../app/Restaurant/restaurantProvider");
const restaurantService = require("../../app/Restaurant/restaurantService");
const baseResponse = require("../../../config/baseResponseStatus");
const secret_config = require("../../../config//secret");
const { response, errResponse } = require("../../../config/response");
const jwt = require("jsonwebtoken");
const request = require("request");

const regexEmail = require("regex-email");
const { emit } = require("nodemon");

/**
 * API No.
 * API Name : 맛집조회 (+지역 선택)
 * [GET] /app/restaurants?area=""
 */
exports.getRestaurants = async function (req, res) {
  /**
   * Query String: area, sort, category, food, price, parking, page, limit, lat, long
   */
  const token = req.headers["x-access-token"] || req.query.token;
  var userIdFromJWT;
  var area = req.query.area;
  var parent_area; //시,도
  const {
    sort,
    category,
    food,
    price,
    parking,
    page,
    limit,
    lat,
    long,
  } = req.query;
  console.log(typeof lat);
  //위치정보 받은 경우
  if (!area && lat && long) {
    //카카오 API 호출
    const header = `KakaoAK ${secret_config.KAKAO_SECRET}`;
    const api_url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?input_coord=WGS84&output_coord=WGS84&y=${lat}&x=${long}`;
    const options = {
      url: api_url,
      headers: { Authorization: header },
    };
    //kakao = async function (req, res){
    request.get(options, async function (error, response, body) {
      if (!error && response.statusCode == 200) {
        const obj = JSON.parse(body);
        parent_area = obj.documents[0].region_1depth_name;
        const local = obj.documents[0].region_2depth_name;
        console.log(local);
        //특별시 제거
        if (parent_area === "서울특별시") {
          parent_area = "서울 ";
          area = parent_area + local;
        } else {
          //구 제거
          area = "";
          let i = 0;
          for (
            ;
            local[i] !== "시" && local[i] !== "군" && i < local.length - 2;
            i++
          ) {
            area += local[i];
          }
          area += local[i];
        }
      } else {
        if (response != null) {
          res.send(errResponse(baseResponse.LOCATION_FAIL));
        }
      }
    });
  }

  //토큰 받은 경우
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

  if (sort > 3 || sort < 0)
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

  //카카오 API 사용해야하는 경우 지연시간때문에 3초기다림
  if (lat && long && !area) {
    setTimeout(binding, 1000);
    console.log("여기");
  } else {
    binding();
  }

  async function binding() {
    const restaurantListResult = await restaurantProvider.retrieveRestaurantList(
      userIdFromJWT,
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
    return res.send(response(baseResponse.SUCCESS, restaurantListResult));
  }
};

/**
 * API No.
 * API Name : 맛집 상세 조회
 * [GET] /app/restaurants?area=""
 */
exports.getRestaurantsById = async function (req, res) {
  /**
   * path variable : restaurantIdx
   */
  const token = req.headers["x-access-token"] || req.query.token;
  var userIdFromJWT;
  const restaurantIdx = req.params.restaurantIdx;

  //토큰 받은 경우
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

  if (!restaurantIdx)
    return res.send(response(baseResponse.RESTAURANT_ID_EMPTY));

  const restaurantResult = await restaurantProvider.retrieveRestaurant(
    userIdFromJWT,
    restaurantIdx
  );

  //조회수 반영
  const retaurantViewResult = await restaurantService.addRestaurantViews(
    restaurantIdx
  );
  return res.send(response(baseResponse.SUCCESS, restaurantResult));
};
