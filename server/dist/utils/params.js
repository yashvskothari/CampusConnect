"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParam = getParam;
exports.getQuery = getQuery;
function getParam(value) {
    if (Array.isArray(value))
        return value[0];
    return value ?? '';
}
function getQuery(value) {
    if (typeof value === 'string')
        return value;
    if (Array.isArray(value))
        return value[0];
    return undefined;
}
