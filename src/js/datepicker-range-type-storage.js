/**
 * Date range type storage class
 */
function DatepickerRangeTypeStorage() {
    this._types = Object.create(null, {});
    this._first = null;
}

DatepickerRangeTypeStorage.prototype.add = function(type) {
    if (!(type instanceof DatepickerRangeType)) {
        throw new Error('type must be instance of DatepickerRangeType');
    }

    this._types[type.getValue()] = type;
    if (this._first === null) {
        this._first = type;
    }
};

DatepickerRangeTypeStorage.prototype.get = function(value) {
    if (!(value in this._types)) {
        throw new Error('Missing date range type');
    }

    return this._types[value];
};

DatepickerRangeTypeStorage.prototype.iterate = function(callback) {
    for (var value in this._types) {
        callback(this._types[value]);
    }
};

DatepickerRangeTypeStorage.prototype.getFirst = function() {
    return this._first;
};
