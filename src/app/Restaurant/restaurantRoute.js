module.exports = function (app) {
  const restaurant = require("./restaurantController");
  const jwtMiddleware = require("../../../config/jwtMiddleware");

  app.get("/app/restaurants", restaurant.getRestaurants);

  app.get("/app/restaurants/:restaurantIdx", restaurant.getRestaurantsById);

  app.post(
    "/app/restaurants/:restaurantIdx/star",
    jwtMiddleware,
    restaurant.postStar
  );
  app.post(
    "/app/restaurants/:restaurantIdx/visited",
    jwtMiddleware,
    restaurant.postVisited
  );
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
};
