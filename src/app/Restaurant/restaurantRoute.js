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

  //맛집 이미지 상세조회
  //app.get("/app/restaurants/:restaurantIdx/", restaurant.getRestaurantsById);
};
