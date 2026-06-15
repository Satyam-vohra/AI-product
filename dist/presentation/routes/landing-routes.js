"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const landing_controller_1 = require("../controllers/landing-controller");
const router = (0, express_1.Router)();
router.get('/', landing_controller_1.getLandingData);
exports.default = router;
