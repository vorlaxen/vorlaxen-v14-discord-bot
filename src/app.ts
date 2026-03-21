if (process.env.NODE_ENV == "production") {
    require("module-alias/register");
}

import { bootstrap } from "./core/bootstrap";

bootstrap();