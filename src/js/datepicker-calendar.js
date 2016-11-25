/**
 * Months names
 */
var MONTHS_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Class for handling calendar
 * Constructor
 *
 * @param {DatepickerRangeStorage} rangeStorage - It is used for displaying added ranges
 * @param {DatepickerRangeTypeStorage} typeStorage - It is used for retrieving types classes
 * @param {DatepickerRange} selectedRange - Instance of selected range from datepicker
 * @param {Object} $calendarBlock - jQuery object of block with calendar
 */

function DatepickerCalendar(rangeStorage, typeStorage, selectedRange, $calendarBlock) {
    if (!(rangeStorage instanceof DatepickerRangeStorage)) {
        throw new Error('rangeStorage must be instance of DatepickerRangeStorage');
    }
    this._rangeStorage = rangeStorage;

    if (!(typeStorage instanceof DatepickerRangeTypeStorage)) {
        throw new Error('typeStorage must be instance of DatepickerRangeTypeStorage');
    }
    this._typeStorage = typeStorage;

    if (!(selectedRange instanceof DatepickerRange)) {
        throw new Error('selectedRange must be instance of DatepickerRange');
    }
    this._selectedRange = selectedRange;

    this._$caption = $calendarBlock.find('.datepicker-month-caption');
    this._$days = $calendarBlock.find('.datepicker-days-table tbody');
    this._$prevBtn = $calendarBlock.find('.datepicker-prev-month-button');
    this._$nextBtn = $calendarBlock.find('.datepicker-next-month-button');

    var todayDate = new Date();
    this._year = todayDate.getFullYear();
    this._month = todayDate.getMonth();

    this._todayYear = todayDate.getFullYear();
    this._todayMonth = todayDate.getMonth();
    this._todayDay = todayDate.getDate();

    this._changeCallback = null;
}

/**
 * Render caption and days table
 */
DatepickerCalendar.prototype.render = function() {
    this._$caption.html(MONTHS_NAMES[this._month] + " " + this._year);
    this._$days.empty();

    var $row = $('<tr>'),
        dayOfWeek = (new Date(this._year, this._month, 1)).getDay(),
        offset;

    for (offset = 0; offset < dayOfWeek; offset++) {
        $row.append(this._renderEmptyDayCell());
    }

    var daysInMonth = (new Date(this._year, this._month + 1, 0)).getDate();
    for (var day = 1; day <= daysInMonth; day++) {
        $row.append(this._renderDayCell(day));

        dayOfWeek++;
        if (dayOfWeek == 7) {
            dayOfWeek = 0;
            this._$days.append($row);

            if (day !== daysInMonth) {
                $row = $('<tr>');
            }
        }
    }

    if (dayOfWeek > 0) {
        for (offset = dayOfWeek; offset < 7; offset++) {
            $row.append(this._renderEmptyDayCell());
        }
        this._$days.append($row);
    }
};

/**
 * Register user handles
 */
DatepickerCalendar.prototype.registerHandlers = function() {
    var self = this;

    this._$prevBtn.click(function(e) {
        self._month--;
        if (self._month < 0) {
            self._month = 11;
            self._year--;
        }

        self.render();
    });

    this._$nextBtn.click(function(e) {
        self._month++;
        if (self._month > 11) {
            self._month = 0;
            self._year++;
        }

        self.render();
    });

    this._$days.on('click', 'a', function(e) {
        e.preventDefault();

        if (self._changeCallback) {
            self._changeCallback(self._year, self._month, $(this).data('day'));
        }
    });
};

/**
 * Allows calling function after day has been selected
 *
 * @param {Function} fn
 */
DatepickerCalendar.prototype.setChangeCallback = function(fn) {
    if (!(fn instanceof Function)) {
        throw new Error('type change callback must be instance of Function');
    }

    this._changeCallback = fn;
};

/**
 * Render empty single day cell
 *
 * @return {Object}
 */
DatepickerCalendar.prototype._renderEmptyDayCell = function() {
    return $('<td></td>');
};

/**
 * Is rendering day is today
 *
 * @param {number} day
 * @return {boolean}
 */
DatepickerCalendar.prototype._isToday = function(day) {
    return  this._year === this._todayYear && this._month === this._todayMonth && day === this._todayDay;
};

/**
 * Is rendering day is in range
 *
 * @param {number} day
 * @param {DatepickerRange} range
 * @return {boolean}
 */
DatepickerCalendar.prototype._isInRange = function(day, range) {
    var date = new Date(this._year, this._month, day);

    return date.getTime() >= range.getStart().getTime() && date.getTime() <= range.getFinish().getTime();
};

/**
 * Is rendering day is the point of range
 *
 * @param {number} day
 * @param {DatepickerRange} range
 * @return {boolean}
 */
DatepickerCalendar.prototype._isMarked = function(day, range) {
    var date = new Date(this._year, this._month, day);

    return date.getTime() === range.getStart().getTime() || date.getTime() === range.getFinish().getTime();
};

/**
 * Render single day cell
 *
 * @param {number} day
 * @return {Object}
 */
DatepickerCalendar.prototype._renderDayCell = function(day) {
    var $cell = $('<td>'),
        $link = $('<a>' , {href: '#', 'data-day': day, text: day}),
        self = this;

    if (this._isToday(day)) {
        $link.addClass('today');
    }

    this._rangeStorage.getDates().forEach(function(range) {
        if (self._isInRange(day, range)) {
            $link.addClass(range.getType().getClass());
        }
    });

    if (this._isMarked(day, this._selectedRange)) {
        $link.addClass('marked');
    }

    if (this._isInRange(day, this._selectedRange)) {
        $link.addClass('selected');
    }

    $cell.append($link);
    return $cell;
};
