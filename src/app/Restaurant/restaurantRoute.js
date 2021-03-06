module.exports = function (app) {
  const restaurant = require("./restaurantController");
  const jwtMiddleware = require("../../../config/jwtMiddleware");

  //맛집 전체조회
  app.get("/app/restaurants", restaurant.getRestaurants);

  //맛집 상세조회
  app.get("/app/restaurants/:restaurantIdx", restaurant.getRestaurantsById);

  //가고싶다 등록
  app.post(
    "/app/restaurants/:restaurantIdx/star",
    jwtMiddleware,
    restaurant.postStar
  );

  //가봤어요 등록
  app.post(
    "/app/restaurants/:restaurantIdx/visited",
    jwtMiddleware,
    restaurant.postVisited
  );
  //가봤어요 수정
  app.patch(
    "/app/restaurants/visited/:visitedIdx",
    jwtMiddleware,
    restaurant.patchVisited
  );
  //가봤어요 삭제
  app.patch(
    "/app/restaurants/visited/:visitedIdx/status",
    jwtMiddleware,
    restaurant.patchVisitedStatus
  );
  //검색
  app.get("/app/search", restaurant.getSearch);

  //식당 등록
  app.post("/app/restaurants", jwtMiddleware, restaurant.postRestaurant);

  //맛집 이미지 전체조회
  app.get("/app/restaurants/:restaurantIdx/image", restaurant.getImages);

  //맛집 리뷰 전체조회
  app.get("/app/restaurants/:restaurantIdx/review", restaurant.getReviews);

  //주변 인기 식당
  app.get("/app/restaurants/:restaurantIdx/recommend", restaurant.getRecommend);
};
