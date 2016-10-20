$(function() {
    (function(window, document, localStorage) {
        /**
         * Hide time for warnings
         */
        const HIDE_TIME = 2000;
        
        /**
         * Months names
         */
        const MONTHS_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        /**
         * Key for local storage to store data
         */
        const LOCAL_STORAGE_KEY = 'datepicker-plugin';
        
        /**
         * Window template
         */
        const TEMPLATE = `
<div class="datepicker-range">

    <div class="datepicker-calendar datepicker-calendar-start">
        <div class="datepicker-calendar-inner datepicker-panel">
            <div class="datepicker-calendar-header">
                <a href="#" class="datepicker-month-button datepicker-prev-month-button">
                    <span class="datepicker-month-button-text">&#8678</span>
                </a>
                <a href="#" class="datepicker-month-button datepicker-next-month-button">
                    <span class="datepicker-month-button-text">&#8680</span>
                </a>
                <div class="datepicker-month-caption">
                    2016
                </div>
            </div>

            <div class="datepicker-calendar-days">
                <table class="datepicker-days-table">
                    <thead>
                        <tr>
                            <th>Su</th>
                            <th>Mo</th>
                            <th>Tu</th>
                            <th>We</th>
                            <th>Th</th>
                            <th>Fr</th>
                            <th>Sa</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="datepicker-calendar datepicker-calendar-finish">
        <div class="datepicker-calendar-inner datepicker-panel">
            <div class="datepicker-calendar-header">
                <a href="#" class="datepicker-month-button datepicker-prev-month-button">
                    <span class="datepicker-month-button-text">&#8678</span>
                </a>
                <a href="#" class="datepicker-month-button datepicker-next-month-button">
                    <span class="datepicker-month-button-text">&#8680</span>
                </a>
                <div class="datepicker-month-caption">
                    2016
                </div>
            </div>

            <div class="datepicker-calendar-days">
                <table class="datepicker-days-table">
                    <thead>
                        <tr>
                            <th>Su</th>
                            <th>Mo</th>
                            <th>Tu</th>
                            <th>We</th>
                            <th>Th</th>
                            <th>Fr</th>
                            <th>Ss</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="datepicker-clear"></div>

</div>

<div class="datepicker-warnings datepicker-panel">
    <div class="datepicker-warning datepicker-cleared">Dates have been deleted!</div>
    <div class="datepicker-warning datepicker-success">Date range has been added!</div>
    <div class="datepicker-warning datepicker-intersect">Selected date range is intersecting with added ranges!</div>
    <div class="datepicker-override">
        <label>
            <input type="checkbox" name="datepicker_override">
            <span>Allow adding intersecting ranges</span>
        </label>
    </div>
</div>

<div class="datepicker-options datepicker-panel">
</div>

<div class="datepicker-buttons">
    <button class="datepicker-btn-add">Add</button>
    <button class="datepicker-btn-clear">Clear</button>
</div>
        `;
        
        /**
         * Date range type template
         */
        const TYPE_TEMPLATE = `
<div class="datepicker-type">
    <label>
        <input type="radio" name="datepicker_type"> <span class="datepicker-type-text"></span>
    </label>
</div>
        `;

        /**
         * Date range type class
         */
        class DatepickerRangeType {
            /**
             * Constructor
             *
             * @param {String} value
             * @param {String} classString
             * @param {String} description
             */
            constructor(value, classString, description) {
                this._value = value;
                this._class = classString;
                this._description = description;
            }

            getValue() {
                return this._value;
            }

            getClass() {
                return this._class;
            }

            getDescription() {
                return this._description;
            }
        }


        /**
         * Date range type storage class
         */
        class DatepickerRangeTypeStorage {
            constructor() {
                this._types = new Map();
                this._first = null;
            }

            add(type) {
                if (!type instanceof DatepickerRangeType) {
                    throw new Error('type must be instance of DatepickerRangeType');
                }

                this._types.set(type.getValue(), type);
                if (this._first === null) {
                    this._first = type;
                }
            }

            get(value) {
                if (!this._types.has(value)) {
                    throw new Error('Missing date range type');
                }

                return this._types.get(value);
            }

            iterate(callback) {
                for (let type of this._types) {
                    callback(type[1]);
                }
            }

            getFirst() {
                return this._first;
            }
        }


        /**
         * Date range class
         */
        class DatepickerRange {
            constructor(start, finish, type) {
                if ((!start instanceof Date) || (!finish instanceof Date)) {
                    throw new Error('start and finish in DatepickerRange must be instances of Date');
                }

                this._start = start;
                this._finish = finish;

                this._start.setHours(0, 0, 0, 0);
                this._finish.setHours(0, 0, 0, 0);

                this.setType(type);
            }

            getStart() {
                return this._start;
            }

            getFinish() {
                return this._finish;
            }

            getType() {
                return this._type;
            }

            setType(type) {
                if (!type instanceof DatepickerRangeType) {
                    throw new Error('type must be instance of DatepickerRangeType');
                }

                this._type = type;
            }

            isIntersect(range) {
                if (!range instanceof DatepickerRange) {
                    throw new Error('range must be instance of DatepickerRange');
                }

                let left = this._start.getTime();
                let right = this._finish.getTime();

                left = Math.max(left, range.getStart().getTime());
                right = Math.min(right, range.getFinish().getTime());

                return right >= left;
            }
        }


        /**
         * Date range storage class
         * Stores all data in localstorage
         */
        class DatepickerRangeStorage {
            constructor(typeStorage) {
                this._dates = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));

                if (!typeStorage instanceof DatepickerRangeTypeStorage) {
                    throw new Error('typeStorage must be instance of DatepickerRangeTypeStorage');
                }
                this._typeStorage = typeStorage;

                if (!this._dates) {
                    this._dates = [];
                } else {
                    this._dates = this._dates.map(date => new DatepickerRange(new Date(date.start), new Date(date.finish), this._typeStorage.get(date.type)));
                }
            }

            getDates() {
                return this._dates;
            }

            add(datepickerRange) {
                if (!datepickerRange instanceof DatepickerRange) {
                    throw new Error('datepickerRange must be instance of DatepickerRange');
                }
                this._dates.push(datepickerRange);
                this._save();
            }

            clear() {
                this._dates = [];
                this._save();
            }

            _save() {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this._dates.map(date => {
                    return {
                        start: date.getStart(),
                        finish: date.getFinish(),
                        type: date.getType().getValue()
                    }
                })));
            }
        }


        /**
         * Class for handling calendar
         */
        class DatepickerCalendar {

            /**
             * Constructor
             *
             * @param {DatepickerRangeStorage} rangeStorage - It is used for displaying added ranges
             * @param {DatepickerRangeTypeStorage} typeStorage - It is used for retrieving types classes
             * @param {DatepickerRange} selectedRange - Instance of selected range from datepicker
             * @param {Object} $calendarBlock - jQuery object of block with calendar
             */
            constructor(rangeStorage, typeStorage, selectedRange, $calendarBlock) {
                if (!rangeStorage instanceof DatepickerRangeStorage) {
                    throw new Error('rangeStorage must be instance of DatepickerRangeStorage');
                }
                this._rangeStorage = rangeStorage;

                if (!typeStorage instanceof DatepickerRangeTypeStorage) {
                    throw new Error('typeStorage must be instance of DatepickerRangeTypeStorage');
                }
                this._typeStorage = typeStorage;

                if (!selectedRange instanceof DatepickerRange) {
                    throw new Error('selectedRange must be instance of DatepickerRange');
                }
                this._selectedRange = selectedRange;

                this._$caption = $calendarBlock.find('.datepicker-month-caption');
                this._$days = $calendarBlock.find('.datepicker-days-table tbody');
                this._$prevBtn = $calendarBlock.find('.datepicker-prev-month-button');
                this._$nextBtn = $calendarBlock.find('.datepicker-next-month-button');

                let todayDate = new Date();
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
            render() {
                this._$caption.html(MONTHS_NAMES[this._month] + " " + this._year);
                this._$days.empty();

                let $row = $('<tr>');
                let dayOfWeek = (new Date(this._year, this._month, 1)).getDay();

                for (let offset = 0; offset < dayOfWeek; offset++) {
                    $row.append(this._renderEmptyDayCell());
                }

                let daysInMonth = (new Date(this._year, this._month + 1, 0)).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
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
                    for (let offset = dayOfWeek; offset < 7; offset++) {
                        $row.append(this._renderEmptyDayCell());
                    }
                    this._$days.append($row);
                }
            }

            /**
             * Register user handles
             */
            registerHandlers() {
                let self = this;

                this._$prevBtn.click(e => {
                    this._month--;
                    if (this._month < 0) {
                        this._month = 11;
                        this._year--;
                    }

                    this.render();
                });

                this._$nextBtn.click(e => {
                    this._month++;
                    if (this._month > 11) {
                        this._month = 0;
                        this._year++;
                    }

                    this.render();
                });

                this._$days.on('click', 'a', function(e) {
                    e.preventDefault();

                    if (self._changeCallback) {
                        self._changeCallback(self._year, self._month, $(this).data('day'));
                    }
                });
            }

            /**
             * Allows calling function after day has been selected
             *
             * @param {Function} fn
             */
            setChangeCallback(fn) {
                if (!fn instanceof Function) {
                    throw new Error('type change callback must be instance of Function');
                }

                this._changeCallback = fn;
            }

            /**
             * Render empty single day cell
             *
             * @return {Object}
             */
            _renderEmptyDayCell() {
                return $('<td></td>');
            }

            /**
             * Is rendering day is today
             *
             * @param day Number
             * @return {Boolean}
             */
            _isToday(day) {
                return  this._year === this._todayYear
                && this._month === this._todayMonth
                && day === this._todayDay;
            }

            /**
             * Is rendering day is in range
             *
             * @param {Number} day
             * @param {DatepickerRange} range
             * @return {Boolean}
             */
            _isInRange(day, range) {
                let date = new Date(this._year, this._month, day);

                return date.getTime() >= range.getStart().getTime() && date.getTime() <= range.getFinish().getTime();
            }

            /**
             * Is rendering day is the point of range
             *
             * @param {Number} day
             * @param {DatepickerRange} range
             * @return {Boolean}
             */
            _isMarked(day, range) {
                let date = new Date(this._year, this._month, day);

                return date.getTime() === range.getStart().getTime() || date.getTime() === range.getFinish().getTime();
            }

            /**
             * Render single day cell
             *
             * @param {Number} day
             * @return {Object}
             */
            _renderDayCell(day) {
                let $cell = $('<td>');
                let $link = $('<a>' , {href: '#', 'data-day': day, text: day});

                if (this._isToday(day)) {
                    $link.addClass('today');
                }

                this._rangeStorage.getDates().forEach(range => {
                    if (this._isInRange(day, range)) {
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
            }
        }


        /**
          * Date picker main class
          */
        class Datepicker {

            /**
             * Constructor
             *
             * @param {DatepickerRangeStorage} rangeStorage
             * @param {DatepickerRangeTypeStorage} typeStorage
             */            
            constructor(rangeStorage, typeStorage) {
                if (!rangeStorage instanceof DatepickerRangeStorage) {
                    throw new Error('rangeStorage must be instance of DatepickerRangeStorage');
                }
                this._rangeStorage = rangeStorage;

                if (!typeStorage instanceof DatepickerRangeTypeStorage) {
                    throw new Error('typeStorage must be instance of DatepickerRangeStorage');
                }
                this._typeStorage = typeStorage;

                this._$window = null;

                this._startCalendar = null;
                this._finishCalendar = null;

                this._$typesBlock = null;

                this._$addBtn = null;
                this._$clearBtn = null;

                this._$success = null;
                this._$cleared = null;
                this._$warning = null;
                this._$override = null;

                this._selectedRange = new DatepickerRange(new Date(), new Date(), this._typeStorage.getFirst());
            }

            /**
             * Display window
             *
             * @param {number} posX
             * @param {number} posY
             */
            showWindow(posX, posY) {
                if (this._$window === null) {
                    this._renderWindow();
                    this._registerHandlers();
                }

                this._$window.css('left', posX);
                this._$window.css('top', posY);
                this._$window.show();
            }

            /**
             * Hide window
             */
            hideWindow() {
                if (this._$window !== null) {
                    this._$window.hide();
                }
            }

            /**
             * Render window
             */
            _renderWindow() {
                this._$window = $('<div class="datepicker-window"></div>');
                this._$window.html(TEMPLATE);

                this._renderTypes();

                this._$success = this._$window.find('.datepicker-success');
                this._$cleared = this._$window.find('.datepicker-cleared');
                this._$intersect = this._$window.find('.datepicker-intersect');
                this._$override = this._$window.find('.datepicker-override input');

                this._startCalendar = new DatepickerCalendar(this._rangeStorage, this._typeStorage, this._selectedRange, this._$window.find('.datepicker-calendar-start'));
                this._finishCalendar = new DatepickerCalendar(this._rangeStorage, this._typeStorage, this._selectedRange, this._$window.find('.datepicker-calendar-finish'));
                this._renderCalendars();

                this._$addBtn = this._$window.find('.datepicker-btn-add');
                this._$clearBtn = this._$window.find('.datepicker-btn-clear');

                $('body').append(this._$window);
            }

            /**
             * Render types selection
             */
            _renderTypes() {
                this._$typesBlock = this._$window.find('.datepicker-options');
                this._typeStorage.iterate(type => {
                    let row = $(TYPE_TEMPLATE);
                    let $input = row.find('input');
                    $input.data('type', type.getValue());

                    if (type == this._selectedRange.getType()) {
                        $input.prop('checked', true);
                    }
                    row.find('.datepicker-type-text').html(type.getDescription());

                    this._$typesBlock.append(row);
                });
            }

            /**
             * Render calendars and intersection warning
             */
            _renderCalendars() {
                this._startCalendar.render();
                this._finishCalendar.render();

                this._$intersect.toggle(this._isSelectedRangeIntersect());
            }

            /**
             * Register handlers
             */
            _registerHandlers() {
                let self = this;

                $(document).click(() => this.hideWindow());
                this._$window.click(e => e.stopPropagation());

                this._startCalendar.registerHandlers();
                this._finishCalendar.registerHandlers();

                this._startCalendar.setChangeCallback((year, month, day) => {
                    this._selectedRange.getStart().setFullYear(year, month, day);
                    this._renderCalendars();
                });
                this._finishCalendar.setChangeCallback((year, month, day) => {
                    this._selectedRange.getFinish().setFullYear(year, month, day);
                    this._renderCalendars();
                });

                this._$addBtn.click(e => {
                    if (this._selectedRange.getStart().getTime() > this._selectedRange.getFinish().getTime()) {
                        return;
                    }

                    if (this._$override.prop('checked') === true || !this._isSelectedRangeIntersect()) {
                        let resultRange = new DatepickerRange(
                            new Date(this._selectedRange.getStart().getTime()),
                            new Date(this._selectedRange.getFinish().getTime()),
                            this._selectedRange.getType()
                        );

                        this._rangeStorage.add(resultRange);
                        this._renderCalendars();

                        this._$success.show();
                        this._$success.hide(HIDE_TIME);
                    }
                });

                this._$clearBtn.click(e => {
                    this._rangeStorage.clear();
                    this._renderCalendars();

                    this._$cleared.show();
                    this._$cleared.hide(HIDE_TIME);
                });

                this._$typesBlock.on('change', 'input', function() {
                    self._selectedRange.setType(self._typeStorage.get($(this).data('type')));
                });
            }

            /**
             * Is selected range intersecting added ranges
             *
             * @return {boolean}
             */
            _isSelectedRangeIntersect() {
                let isIntersect = false;

                this._rangeStorage.getDates().forEach(range => {
                    if (this._selectedRange.isIntersect(range)) {
                        isIntersect = true;
                    }
                });

                return isIntersect;
            }
        } 


        /**
         * Date range type storage instance
         * @var {DatepickerRangeTypeStorage}
         */
        let datepickerRangeTypeStorage = new DatepickerRangeTypeStorage();
        [
            new DatepickerRangeType(1, 'range-1', 'Reminder'),
            new DatepickerRangeType(2, 'range-2', 'Meeting'),
            new DatepickerRangeType(3, 'range-3', 'Appointment'),
        ].forEach(v => datepickerRangeTypeStorage.add(v));

        /**
         * Date range storage instance
         * @var {DatepickerRangeStorage}
         */
        let datepickerRangeStorage = null;

        /**
         * Datepicker instance
         * @var {Datepicker}
         */
        let datepicker = null;

        /*
         * Plugin
         */
        $.fn.datepicker = function() {
            if (datepickerRangeStorage === null) {
                datepickerRangeStorage = new DatepickerRangeStorage(datepickerRangeTypeStorage);
            }

            if (datepicker === null) {
                datepicker = new Datepicker(datepickerRangeStorage, datepickerRangeTypeStorage);
            }

            $(this).each(() => {
                let $this = $(this);
                $this.on('datepicker.show', (e, posX, posY) => datepicker.showWindow(posX, posY));
            });

            return this;
        };
    })(window, document, localStorage);

    /*
     * Usage
     */
    $('#target').datepicker().click(function(e) {
        e.stopPropagation();

        $(this).trigger('datepicker.show', '200px', '200px');
    });
});