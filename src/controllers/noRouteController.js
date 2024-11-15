import { customError } from "../errors/errorUtils/index.js";

const noRouteController = (req, res, next) => {
    const err = new customError(404, "Please check the URL");
    next(err);
};

export default noRouteController;
