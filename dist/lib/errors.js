"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = exports.ApiError = void 0;
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(code, status, message) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.status = status;
        _this.name = 'ApiError';
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
exports.Errors = {
    NOT_FOUND: function (resource) { return new ApiError('NOT_FOUND', 404, "".concat(resource, " not found")); },
    UNAUTHORIZED: function () { return new ApiError('UNAUTHORIZED', 401, 'Unauthorized'); },
    FORBIDDEN: function () { return new ApiError('FORBIDDEN', 403, 'Forbidden'); },
    BAD_REQUEST: function (message) { return new ApiError('BAD_REQUEST', 400, message); },
    INTERNAL: function (message) { return new ApiError('INTERNAL_ERROR', 500, message); },
};
