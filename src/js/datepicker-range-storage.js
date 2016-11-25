/**
 * Key for local storage to store data
 */
var LOCAL_STORAGE_KEY = 'datepicker-plugin';

/**
 * Date range storage class
 * Stores all data in localstorage
 */
function DatepickerRangeStorage(typeStorage) {
    this._dates = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));

    if (!(typeStorage instanceof DatepickerRangeTypeStorage)) {
        throw new Error('typeStorage must be instance of DatepickerRangeTypeStorage');
    }
    this._typeStorage = typeStorage;

    if (!this._dates) {
        this._dates = [];
    } else {
        this._dates = this._dates.map((function(date) {
            return new DatepickerRange(new Date(date.start), new Date(date.finish), this._typeStorage.get(date.type));
        }).bind(this));
    }
}

DatepickerRangeStorage.prototype.getDates = function() {
    return this._dates;
};

DatepickerRangeStorage.prototype.add = function(datepickerRange) {
    if (!(datepickerRange instanceof DatepickerRange)) {
        throw new Error('datepickerRange must be instance of DatepickerRange');
    }
    this._dates.push(datepickerRange);
    this._save();
};

DatepickerRangeStorage.prototype.clear = function() {
    this._dates = [];
    this._save();
};

DatepickerRangeStorage.prototype._save = function() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this._dates.map(function(date) {
        return {
            start: date.getStart(),
            finish: date.getFinish(),
            type: date.getType().getValue()
        };
    })));
};
