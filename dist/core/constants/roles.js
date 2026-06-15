"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolutionStatus = exports.SubscriptionPlan = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "Admin";
    UserRole["COMPANY"] = "Company";
    UserRole["SERVICE_ENGINEER"] = "ServiceEngineer";
    UserRole["USER"] = "User";
})(UserRole || (exports.UserRole = UserRole = {}));
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["FREE"] = "Free";
    SubscriptionPlan["GROWTH"] = "Growth";
    SubscriptionPlan["ENTERPRISE"] = "Enterprise";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var ResolutionStatus;
(function (ResolutionStatus) {
    ResolutionStatus["OPEN"] = "Open";
    ResolutionStatus["PENDING"] = "Pending";
    ResolutionStatus["RESOLVED"] = "Resolved";
})(ResolutionStatus || (exports.ResolutionStatus = ResolutionStatus = {}));
