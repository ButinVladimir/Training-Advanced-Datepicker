/**
 * Date range class
 */
function DatepickerRange(start, finish, type) {
    if (!(start instanceof Date) || !(finish instanceof Date)) {
        throw new Error('start and finish in DatepickerRange must be instances of Date');
    }

    this._start = start;
    this._finish = finish;

    this._start.setHours(0, 0, 0, 0);
    this._finish.setHours(0, 0, 0, 0);

    this.setType(type);
}

DatepickerRange.prototype.getStart = function() {
    return this._start;
};

DatepickerRange.prototype.getFinish = function() {
    return this._finish;
};

DatepickerRange.prototype.getType = function() {
    return this._type;
};

DatepickerRange.prototype.setType = function(type) {
    if (!(type instanceof DatepickerRangeType)) {
        throw new Error('type must be instance of DatepickerRangeType');
    }

    this._type = type;
};

DatepickerRange.prototype.isIntersect = function(range) {
    if (!(range instanceof DatepickerRange)) {
        throw new Error('range must be instance of DatepickerRange');
    }

    var left = this._start.getTime(),
        right = this._finish.getTime();

    left = Math.max(left, range.getStart().getTime());
    right = Math.min(right, range.getFinish().getTime());

    return right >= left;
};
