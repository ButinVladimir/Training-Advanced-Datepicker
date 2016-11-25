/**
 * Date range type class
 * Constructor
 *
 * @param {string} value
 * @param {string} classString
 * @param {string} description
 */
function DatepickerRangeType(value, classString, description) {
    this._value = value;
    this._class = classString;
    this._description = description;
}

DatepickerRangeType.prototype.getValue = function() {
    return this._value;
};

DatepickerRangeType.prototype.getClass = function() {
    return this._class;
};

DatepickerRangeType.prototype.getDescription = function() {
    return this._description;
};
