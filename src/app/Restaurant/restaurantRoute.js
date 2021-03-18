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
};
