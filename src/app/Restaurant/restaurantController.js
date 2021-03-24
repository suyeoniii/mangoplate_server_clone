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
  var distance = req.query.distance;
  if (!distance) distance = 0;

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
        if (parent_area !== "서울특별시") {
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
  } else {
    binding();
  }

  if (distance > 5 || distance < 0)
    return res.send(response(baseResponse.RESTAURANT_DISTANCE_ERROR_TYPE));

  if (distance == 1) distance = 0.1;
  else if (distance == 2) distance = 0.3;
  else if (distance == 3) distance = 0.5;
  else if (distance == 4) distance = 1;
  else if (distance == 5) distance = 3;

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
      long,
      distance
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

/**
 * API No.
 * API Name : 가고싶다 등록, 수정, 삭제
 * [POST] /app/restaurants/:restaurantIdx/star
 */
exports.postStar = async function (req, res) {
  /**
   * path variable : restaurantIdx
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const restaurantIdx = req.params.restaurantIdx;
  const { contents } = req.body;

  if (!restaurantIdx)
    return res.send(response(baseResponse.RESTAURANT_ID_EMPTY));

  //메모 등록
  if (contents) {
    const postStarResponse = await restaurantService.updateStars(
      userIdFromJWT,
      restaurantIdx,
      contents
    );
    return res.send(postStarResponse);
  } else {
    //등록/해제
    const postStarResponse = await restaurantService.updateStarStatus(
      userIdFromJWT,
      restaurantIdx
    );
    return res.send(postStarResponse);
  }
};

/**
 * API No.
 * API Name : 가봤어요 등록
 * [POST] /app/restaurants/:restaurantIdx/visited
 */
exports.postVisited = async function (req, res) {
  /**
   * path variable : restaurantIdx
   * Body : contents, isPrivate
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const restaurantIdx = req.params.restaurantIdx;
  const contents = req.body.contents;
  var isPrivate = req.body.isPrivate;

  if (!restaurantIdx)
    return res.send(response(baseResponse.RESTAURANT_ID_EMPTY));
  if (!isPrivate) isPrivate = 0;

  const postVisitedResponse = await restaurantService.createVisited(
    userIdFromJWT,
    restaurantIdx,
    contents,
    isPrivate
  );
  return res.send(postVisitedResponse);
};

/**
 * API No.
 * API Name : 가봤어요 수정
 * [PATCH] /app/restaurants/visited/:visitedIdx
 */
exports.patchVisited = async function (req, res) {
  /**
   * path variable : visitedIdx
   * Body : contents, isPrivate
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const visitedIdx = req.params.visitedIdx;
  const contents = req.body.contents;
  var isPrivate = req.body.isPrivate;

  if (!visitedIdx) return res.send(response(baseResponse.VISITED_ID_EMPTY));
  if (!isPrivate) isPrivate = 0;

  const patchVisitedResponse = await restaurantService.updateVisited(
    userIdFromJWT,
    visitedIdx,
    contents,
    isPrivate
  );
  return res.send(patchVisitedResponse);
};
/**
 * API No.
 * API Name : 가봤어요 삭제
 * [PATCH] /app/restaurants/visited/:visitedIdx/status
 */
exports.patchVisitedStatus = async function (req, res) {
  /**
   * path variable : visitedIdx
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const visitedIdx = req.params.visitedIdx;

  if (!visitedIdx) return res.send(response(baseResponse.VISITED_ID_EMPTY));

  const patchVisitedResponse = await restaurantService.updateVisitedStatus(
    userIdFromJWT,
    visitedIdx
  );
  return res.send(patchVisitedResponse);
};
/**
 * API No.
 * API Name : 검색 API
 * [PATCH] /app/restaurants/search
 */
exports.getSearch = async function (req, res) {
  /**
   * Query String : q, area, sort, category, food, price, parking, page, limit, lat, long
   */
  const token = req.headers["x-access-token"] || req.query.token;
  var userIdFromJWT;

  const {
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
  } = req.query;

  var q = req.query.q;

  if (!q) {
    return res.send(errResponse(baseResponse.SEARCH_QUERY_EMPTY));
  }
  q = q.split(" ");

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

  const restaurantListResult = await restaurantProvider.retrieveRestaurantSearch(
    userIdFromJWT,
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
  return res.send(response(baseResponse.SUCCESS, restaurantListResult));
};
/**
 * API No.
 * API Name : 식당 등록
 * [POST] /app/restaurants
 */
exports.postRestaurant = async function (req, res) {
  /**
   * Body : restaurantName, lat, long, phone, food
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const { restaurantName, lat, long } = req.body;
  var phone = req.body.phone;
  var food = req.body.food;

  if (!restaurantName)
    return res.send(response(baseResponse.RESTAURANT_NAME_EMPTY));
  if (!lat || !long)
    return res.send(response(baseResponse.RESTAURANT_LOCATION_EMPTY));

  var area, doro, jibeon;

  //카카오 API 호출 - 도로, 지번주소 검색
  const api_url2 = `https://dapi.kakao.com/v2/local/geo/coord2address.json?input_coord=WGS84&y=${lat}&x=${long}`;
  const header = `KakaoAK ${secret_config.KAKAO_SECRET}`;
  const options2 = {
    url: api_url2,
    headers: { Authorization: header },
  };
  //kakao = async function (req, res){
  request.get(options2, async function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const obj = JSON.parse(body);

      const parent_area = obj.documents[0].address.region_1depth_name;
      const local = obj.documents[0].address.region_2depth_name;
      //특별시 제거
      if (parent_area !== "서울") {
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
      } else {
        area = local;
      }

      doro = obj.documents[0].road_address.address_name;
      jibeon = obj.documents[0].address.address_name;
    }
  });

  if (phone) {
    //번호 정규표현식 체크
    var regMobile = /^01([0|1|6|7|8|9]?)-?([0-9]{3,4})-?([0-9]{4})$/;
    var regPhone = /^\d{2,3}-?\d{3,4}-?\d{4}$/;

    if (!regPhone.test(phone) && !regMobile.test(phone))
      return res.send(response(baseResponse.PHONE_ERROR_TYPE));
  } else {
    phone = null;
  }
  if (!food) food = 0;
  if (food > 8 || food < 0)
    return res.send(response(baseResponse.RESTAURANT_FOOD_ERROR_TYPE));

  //카카오 API 사용해야하는 경우 지연시간때문에 1초기다림
  if (lat && long) {
    setTimeout(binding, 1000);
  } else {
    binding();
  }
  async function binding() {
    const postRestaurantResponse = await restaurantService.createRestaurant(
      restaurantName,
      lat,
      long,
      phone,
      food,
      area,
      doro,
      jibeon
    );
    return res.send(postRestaurantResponse);
  }
};
